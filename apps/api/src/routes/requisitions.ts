import { and, desc, eq, ilike } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateRequisitionBody,
  CreateRequisitionResponse,
  ListRequisitionsQueryParams,
  ListRequisitionsResponse,
} from "@workspace/api-schema";
import { db, approvalStepsTable, requisitionsTable } from "@workspace/db";
import { resolveApprovalChain } from "../lib/approval-policy";
import {
  getOrganization,
  rawParam,
  recordAuditEvent,
  toDateString,
  toRequisitionDetailResponse,
  toRequisitionResponse,
} from "../lib/route-helpers";

const router: IRouter = Router();

router.get("/orgs/:orgSlug/requisitions", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  const query = ListRequisitionsQueryParams.parse(req.query);
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  const filters = [eq(requisitionsTable.organizationId, org.id)];
  if (query.status) filters.push(eq(requisitionsTable.status, query.status));
  if (query.search) filters.push(ilike(requisitionsTable.description, `%${query.search}%`));
  const rows = await db
    .select()
    .from(requisitionsTable)
    .where(and(...filters))
    .orderBy(desc(requisitionsTable.createdAt));
  res.json(ListRequisitionsResponse.parse(rows.map(toRequisitionResponse)));
});

router.post("/orgs/:orgSlug/requisitions", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  const parsed = CreateRequisitionBody.safeParse(req.body);
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const number = `REQ-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
  const [row] = await db
    .insert(requisitionsTable)
    .values({
      organizationId: org.id,
      number,
      requester: req.currentUser?.name ?? "Unknown user",
      description: parsed.data.description,
      estimatedAmountCents: parsed.data.estimatedAmountCents,
      currency: "USD",
      costCenter: parsed.data.costCenter,
      category: parsed.data.category,
      neededByDate: toDateString(parsed.data.neededByDate),
      justification: parsed.data.justification,
      vendorName: parsed.data.vendorName ?? null,
    })
    .returning();
  if (!row) {
    res.status(500).json({ error: "Could not create requisition" });
    return;
  }
  await recordAuditEvent(org.id, req.currentUser?.name ?? "Unknown user", "Created requisition", number);
  res.status(201).json(toRequisitionResponse(row));
});

router.get("/orgs/:orgSlug/requisitions/:requisitionId", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  const [row] = org
    ? await db
        .select()
        .from(requisitionsTable)
        .where(
          and(
            eq(requisitionsTable.organizationId, org.id),
            eq(requisitionsTable.id, rawParam(req.params.requisitionId)),
          ),
        )
        .limit(1)
    : [];
  if (!row) {
    res.status(404).json({ error: "Requisition not found" });
    return;
  }
  res.json(await toRequisitionDetailResponse(row));
});

router.post(
  "/orgs/:orgSlug/requisitions/:requisitionId/submit",
  async (req, res): Promise<void> => {
    const org = await getOrganization(rawParam(req.params.orgSlug));
    const [row] = org
      ? await db
          .select()
          .from(requisitionsTable)
          .where(
            and(
              eq(requisitionsTable.organizationId, org.id),
              eq(requisitionsTable.id, rawParam(req.params.requisitionId)),
            ),
          )
          .limit(1)
      : [];
    if (!org || !row) {
      res.status(404).json({ error: "Requisition not found" });
      return;
    }
    const chain = await resolveApprovalChain(org.id, {
      amountCents: row.estimatedAmountCents,
      costCenter: row.costCenter,
      category: row.category,
    });
    const [updated] = await db
      .update(requisitionsTable)
      .set({ status: "pending_approval", currentApprover: chain[0] ?? null })
      .where(eq(requisitionsTable.id, row.id))
      .returning();
    if (chain.length > 0) {
      await db.insert(approvalStepsTable).values(
        chain.map((approver, index) => ({
          organizationId: org.id,
          requisitionId: row.id,
          stepOrder: index + 1,
          approver,
          status: "pending",
        })),
      );
    }
    await recordAuditEvent(
      org.id,
      req.currentUser?.name ?? "Unknown user",
      "Submitted requisition",
      row.number,
      chain.length > 0 ? `Routed to: ${chain.join(" → ")}` : "No matching approval policy — routed to no one",
    );
    res.json(await toRequisitionDetailResponse(updated ?? row));
  },
);

router.post(
  "/orgs/:orgSlug/requisitions/:requisitionId/withdraw",
  async (req, res): Promise<void> => {
    const org = await getOrganization(rawParam(req.params.orgSlug));
    const [row] = org
      ? await db
          .select()
          .from(requisitionsTable)
          .where(
            and(
              eq(requisitionsTable.organizationId, org.id),
              eq(requisitionsTable.id, rawParam(req.params.requisitionId)),
            ),
          )
          .limit(1)
      : [];
    if (!org || !row) {
      res.status(404).json({ error: "Requisition not found" });
      return;
    }
    const [updated] = await db
      .update(requisitionsTable)
      .set({ status: "withdrawn", currentApprover: null })
      .where(eq(requisitionsTable.id, row.id))
      .returning();
    await recordAuditEvent(org.id, req.currentUser?.name ?? "Unknown user", "Withdrew requisition", row.number);
    res.json(await toRequisitionDetailResponse(updated ?? row));
  },
);

export default router;
