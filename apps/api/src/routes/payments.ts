import { and, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { CreatePaymentBatchBody, CreatePaymentBatchResponse, ExportPaymentBatchResponse, ListPaymentBatchesResponse } from "@workspace/api-schema";
import { db, invoicesTable, paymentBatchesTable } from "@workspace/db";
import { getOrganization, rawParam, recordAuditEvent } from "../lib/route-helpers";

const router: IRouter = Router();

router.get("/orgs/:orgSlug/payment-batches", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  const rows = await db
    .select()
    .from(paymentBatchesTable)
    .where(eq(paymentBatchesTable.organizationId, org.id))
    .orderBy(desc(paymentBatchesTable.createdAt));
  res.json(
    ListPaymentBatchesResponse.parse(
      rows.map((row) => ({
        id: row.id,
        number: row.number,
        invoiceCount: row.invoiceCount,
        totalAmountCents: row.totalAmountCents,
        status: row.status,
        createdAt: row.createdAt,
      })),
    ),
  );
});

router.post("/orgs/:orgSlug/payment-batches", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  const parsed = CreatePaymentBatchBody.safeParse(req.body);
  const idempotencyKey = req.header("Idempotency-Key");
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  if (!idempotencyKey || idempotencyKey.length < 8 || !parsed.success) {
    res.status(400).json({ error: "A valid idempotency key and invoice list are required" });
    return;
  }
  const [existing] = await db
    .select()
    .from(paymentBatchesTable)
    .where(eq(paymentBatchesTable.idempotencyKey, idempotencyKey))
    .limit(1);
  if (existing) {
    res.status(201).json(
      CreatePaymentBatchResponse.parse({
        id: existing.id,
        number: existing.number,
        invoiceCount: existing.invoiceCount,
        totalAmountCents: existing.totalAmountCents,
        status: existing.status,
        createdAt: existing.createdAt,
      }),
    );
    return;
  }
  const invoices = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.organizationId, org.id));
  const selected = invoices.filter((invoice) => parsed.data.invoiceIds.includes(invoice.id));
  const [row] = await db
    .insert(paymentBatchesTable)
    .values({
      organizationId: org.id,
      number: `PAY-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
      invoiceIds: selected.map((invoice) => invoice.id),
      invoiceCount: selected.length,
      totalAmountCents: selected.reduce((sum, invoice) => sum + invoice.totalAmountCents, 0),
      idempotencyKey,
    })
    .returning();
  if (!row) {
    res.status(500).json({ error: "Could not create payment batch" });
    return;
  }
  await recordAuditEvent(org.id, req.currentUser?.name ?? "Unknown user", "Created payment batch", row.number, "Idempotency key enforced");
  res.status(201).json(
    CreatePaymentBatchResponse.parse({
      id: row.id,
      number: row.number,
      invoiceCount: row.invoiceCount,
      totalAmountCents: row.totalAmountCents,
      status: row.status,
      createdAt: row.createdAt,
    }),
  );
});

router.post("/orgs/:orgSlug/payment-batches/:batchId/export", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  const [row] = org
    ? await db
        .select()
        .from(paymentBatchesTable)
        .where(
          and(
            eq(paymentBatchesTable.organizationId, org.id),
            eq(paymentBatchesTable.id, rawParam(req.params.batchId)),
          ),
        )
        .limit(1)
    : [];
  if (!org || !row) {
    res.status(404).json({ error: "Payment batch not found" });
    return;
  }
  const [updated] = await db
    .update(paymentBatchesTable)
    .set({ status: "exported" })
    .where(eq(paymentBatchesTable.id, row.id))
    .returning();
  await recordAuditEvent(org.id, req.currentUser?.name ?? "Unknown user", "Exported payment batch", row.number, "Accounting adapter not connected");
  const result = updated ?? row;
  res.json(
    ExportPaymentBatchResponse.parse({
      id: result.id,
      number: result.number,
      invoiceCount: result.invoiceCount,
      totalAmountCents: result.totalAmountCents,
      status: result.status,
      createdAt: result.createdAt,
    }),
  );
});

export default router;
