import { and, desc, eq, ilike } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreatePurchaseOrderBody,
  CreatePurchaseOrderResponse,
  IssuePurchaseOrderResponse,
  ListPurchaseOrdersQueryParams,
  ListPurchaseOrdersResponse,
} from "@workspace/api-schema";
import { db, budgetsTable, purchaseOrdersTable } from "@workspace/db";
import { asLines, getOrganization, rawParam, recordAuditEvent } from "../lib/route-helpers";

const router: IRouter = Router();

router.get("/orgs/:orgSlug/purchase-orders", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  const query = ListPurchaseOrdersQueryParams.parse(req.query);
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  const filters = [eq(purchaseOrdersTable.organizationId, org.id)];
  if (query.status) filters.push(eq(purchaseOrdersTable.status, query.status));
  if (query.search) filters.push(ilike(purchaseOrdersTable.vendorName, `%${query.search}%`));
  const rows = await db
    .select()
    .from(purchaseOrdersTable)
    .where(and(...filters))
    .orderBy(desc(purchaseOrdersTable.createdAt));
  res.json(
    ListPurchaseOrdersResponse.parse(
      rows.map((row) => ({
        id: row.id,
        number: row.number,
        vendorName: row.vendorName,
        totalAmountCents: row.totalAmountCents,
        currency: row.currency,
        status: row.status,
        issuedAt: row.issuedAt,
        lineItems: asLines(row.lineItems),
      })),
    ),
  );
});

router.post("/orgs/:orgSlug/purchase-orders", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  const parsed = CreatePurchaseOrderBody.safeParse(req.body);
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const lines = parsed.data.lineItems;
  const total = lines.reduce((sum, line) => sum + line.quantity * line.unitPriceCents, 0);
  const [row] = await db
    .insert(purchaseOrdersTable)
    .values({
      organizationId: org.id,
      requisitionId: parsed.data.requisitionId ?? null,
      number: `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
      vendorName: parsed.data.vendorName,
      costCenter: parsed.data.costCenter,
      totalAmountCents: Math.round(total),
      lineItems: lines,
    })
    .returning();
  if (!row) {
    res.status(500).json({ error: "Could not create purchase order" });
    return;
  }
  await recordAuditEvent(org.id, req.currentUser?.name ?? "Unknown user", "Created purchase order", row.number);
  res.status(201).json(
    CreatePurchaseOrderResponse.parse({
      id: row.id,
      number: row.number,
      vendorName: row.vendorName,
      totalAmountCents: row.totalAmountCents,
      currency: row.currency,
      status: row.status,
      issuedAt: row.issuedAt,
      lineItems: lines,
    }),
  );
});

router.post("/orgs/:orgSlug/purchase-orders/:purchaseOrderId/issue", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  const [row] = org
    ? await db
        .select()
        .from(purchaseOrdersTable)
        .where(
          and(
            eq(purchaseOrdersTable.organizationId, org.id),
            eq(purchaseOrdersTable.id, rawParam(req.params.purchaseOrderId)),
          ),
        )
        .limit(1)
    : [];
  if (!org || !row) {
    res.status(404).json({ error: "Purchase order not found" });
    return;
  }
  const [updated] = await db
    .update(purchaseOrdersTable)
    .set({ status: "issued", issuedAt: new Date() })
    .where(eq(purchaseOrdersTable.id, row.id))
    .returning();
  const budget = await db
    .select()
    .from(budgetsTable)
    .where(
      and(
        eq(budgetsTable.organizationId, org.id),
        eq(budgetsTable.costCenter, row.costCenter),
      ),
    )
    .limit(1);
  if (budget[0]) {
    await db
      .update(budgetsTable)
      .set({ committedCents: budget[0].committedCents + row.totalAmountCents })
      .where(eq(budgetsTable.id, budget[0].id));
  }
  await recordAuditEvent(org.id, req.currentUser?.name ?? "Unknown user", "Issued purchase order", row.number, "Budget committed");
  const result = updated ?? row;
  res.json(
    IssuePurchaseOrderResponse.parse({
      id: result.id,
      number: result.number,
      vendorName: result.vendorName,
      totalAmountCents: result.totalAmountCents,
      currency: result.currency,
      status: result.status,
      issuedAt: result.issuedAt,
      lineItems: asLines(result.lineItems),
    }),
  );
});

export default router;
