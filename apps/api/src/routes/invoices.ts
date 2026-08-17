import { and, desc, eq, ilike } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateInvoiceBody,
  CreateInvoiceResponse,
  ListInvoicesQueryParams,
  ListInvoicesResponse,
  ResolveInvoiceExceptionBody,
  RunInvoiceMatchResponse,
} from "@workspace/api-schema";
import { db, invoicesTable, purchaseOrdersTable, receivingRecordsTable } from "@workspace/db";
import { asLines, getOrganization, rawParam, recordAuditEvent, toDateString } from "../lib/route-helpers";

const router: IRouter = Router();

router.get("/orgs/:orgSlug/invoices", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  const query = ListInvoicesQueryParams.parse(req.query);
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  const filters = [eq(invoicesTable.organizationId, org.id)];
  if (query.status) filters.push(eq(invoicesTable.status, query.status));
  if (query.search) filters.push(ilike(invoicesTable.invoiceNumber, `%${query.search}%`));
  const rows = await db
    .select()
    .from(invoicesTable)
    .where(and(...filters))
    .orderBy(desc(invoicesTable.dueDate));
  const pos = await db
    .select()
    .from(purchaseOrdersTable)
    .where(eq(purchaseOrdersTable.organizationId, org.id));
  res.json(
    ListInvoicesResponse.parse(
      rows.map((row) => ({
        id: row.id,
        invoiceNumber: row.invoiceNumber,
        vendorName: row.vendorName,
        totalAmountCents: row.totalAmountCents,
        dueDate: new Date(`${row.dueDate}T00:00:00Z`),
        status: row.status,
        matchStatus: row.matchStatus,
        purchaseOrderNumber: pos.find((po) => po.id === row.purchaseOrderId)?.number ?? null,
      })),
    ),
  );
});

router.post("/orgs/:orgSlug/invoices", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  const parsed = CreateInvoiceBody.safeParse(req.body);
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(invoicesTable)
    .values({
      organizationId: org.id,
      vendorName: parsed.data.vendorName,
      invoiceNumber: parsed.data.invoiceNumber,
      purchaseOrderId: parsed.data.purchaseOrderId ?? null,
      totalAmountCents: parsed.data.totalAmountCents,
      dueDate: toDateString(parsed.data.dueDate),
    })
    .returning();
  if (!row) {
    res.status(500).json({ error: "Could not create invoice" });
    return;
  }
  await recordAuditEvent(org.id, req.currentUser?.name ?? "Unknown user", "Received invoice", row.invoiceNumber);
  res.status(201).json(
    CreateInvoiceResponse.parse({
      id: row.id,
      invoiceNumber: row.invoiceNumber,
      vendorName: row.vendorName,
      totalAmountCents: row.totalAmountCents,
      dueDate: new Date(`${row.dueDate}T00:00:00Z`),
      status: row.status,
      matchStatus: row.matchStatus,
      purchaseOrderNumber: null,
    }),
  );
});

router.post("/orgs/:orgSlug/invoices/:invoiceId/run-match", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  const [invoice] = org
    ? await db
        .select()
        .from(invoicesTable)
        .where(
          and(
            eq(invoicesTable.organizationId, org.id),
            eq(invoicesTable.id, rawParam(req.params.invoiceId)),
          ),
        )
        .limit(1)
    : [];
  if (!org || !invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  const po = invoice.purchaseOrderId
    ? (
        await db
          .select()
          .from(purchaseOrdersTable)
          .where(eq(purchaseOrdersTable.id, invoice.purchaseOrderId))
          .limit(1)
      )[0]
    : undefined;
  const received = po
    ? await db
        .select()
        .from(receivingRecordsTable)
        .where(eq(receivingRecordsTable.purchaseOrderId, po.id))
    : [];
  const poLines = asLines(po?.lineItems);
  const lines = poLines.map((line) => ({
    description: line.description,
    invoiceQuantity: line.quantity,
    poQuantity: line.quantity,
    receivedQuantity: received.reduce((sum, item) => sum + Number(item.quantity), 0),
    status: received.length ? "matched" : "missing_receipt",
  }));
  const status = po && received.length ? "matched" : "exception";
  await db
    .update(invoicesTable)
    .set({ status, matchStatus: status })
    .where(eq(invoicesTable.id, invoice.id));
  await recordAuditEvent(org.id, req.currentUser?.name ?? "Unknown user", `Invoice match: ${status}`, invoice.invoiceNumber);
  res.json(
    RunInvoiceMatchResponse.parse({
      invoiceId: invoice.id,
      status,
      lines,
      summary: status === "matched" ? "All lines matched against the PO and receiving records." : "Review the highlighted exception before payment.",
    }),
  );
});

router.post("/orgs/:orgSlug/invoices/:invoiceId/resolve-exception", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  const parsed = ResolveInvoiceExceptionBody.safeParse(req.body);
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [invoice] = await db
    .select()
    .from(invoicesTable)
    .where(
      and(
        eq(invoicesTable.organizationId, org.id),
        eq(invoicesTable.id, rawParam(req.params.invoiceId)),
      ),
    )
    .limit(1);
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  const nextStatus = parsed.data.resolution === "approve" ? "ready_for_payment" : "disputed";
  const [updated] = await db
    .update(invoicesTable)
    .set({ status: nextStatus })
    .where(eq(invoicesTable.id, invoice.id))
    .returning();
  await recordAuditEvent(org.id, req.currentUser?.name ?? "Unknown user", `Resolved invoice exception: ${parsed.data.resolution}`, invoice.invoiceNumber, parsed.data.note);
  res.json(
    CreateInvoiceResponse.parse({
      id: updated?.id ?? invoice.id,
      invoiceNumber: updated?.invoiceNumber ?? invoice.invoiceNumber,
      vendorName: updated?.vendorName ?? invoice.vendorName,
      totalAmountCents: updated?.totalAmountCents ?? invoice.totalAmountCents,
      dueDate: new Date(`${updated?.dueDate ?? invoice.dueDate}T00:00:00Z`),
      status: updated?.status ?? nextStatus,
      matchStatus: updated?.matchStatus ?? invoice.matchStatus,
      purchaseOrderNumber: null,
    }),
  );
});

export default router;
