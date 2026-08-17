import { and, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { DecideApprovalBody, DecideApprovalResponse, ListApprovalQueueResponse } from "@workspace/api-schema";
import { db, approvalStepsTable, requisitionsTable } from "@workspace/db";
import { getOrganization, rawParam, recordAuditEvent } from "../lib/route-helpers";

const router: IRouter = Router();

router.get("/orgs/:orgSlug/approvals/queue", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  const steps = await db
    .select()
    .from(approvalStepsTable)
    .where(
      and(
        eq(approvalStepsTable.organizationId, org.id),
        eq(approvalStepsTable.status, "pending"),
      ),
    )
    .orderBy(approvalStepsTable.createdAt);
  const requisitions = await db
    .select()
    .from(requisitionsTable)
    .where(eq(requisitionsTable.organizationId, org.id));
  res.json(
    ListApprovalQueueResponse.parse(
      steps.map((step) => {
        const row = requisitions.find((item) => item.id === step.requisitionId);
        return {
          id: step.id,
          requisitionId: step.requisitionId,
          requisitionNumber: row?.number ?? "REQ—",
          description: row?.description ?? "Approval request",
          requester: row?.requester ?? "Requester",
          amountCents: row?.estimatedAmountCents ?? 0,
          costCenter: row?.costCenter ?? "Unassigned",
          ageHours: Math.max(1, (Date.now() - step.createdAt.getTime()) / 3_600_000),
          status: step.status,
        };
      }),
    ),
  );
});

router.post("/orgs/:orgSlug/approvals/:stepId/decide", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  const parsed = DecideApprovalBody.safeParse(req.body);
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [step] = await db
    .select()
    .from(approvalStepsTable)
    .where(
      and(
        eq(approvalStepsTable.organizationId, org.id),
        eq(approvalStepsTable.id, rawParam(req.params.stepId)),
      ),
    )
    .limit(1);
  if (!step) {
    res.status(404).json({ error: "Approval step not found" });
    return;
  }
  const nextStatus =
    parsed.data.decision === "approve" ? "approved" : parsed.data.decision === "reject" ? "rejected" : "changes_requested";
  const [updatedStep] = await db
    .update(approvalStepsTable)
    .set({ status: nextStatus, note: parsed.data.note ?? null, decidedAt: new Date() })
    .where(eq(approvalStepsTable.id, step.id))
    .returning();
  if (parsed.data.decision === "approve") {
    const next = await db
      .select()
      .from(approvalStepsTable)
      .where(
        and(
          eq(approvalStepsTable.requisitionId, step.requisitionId),
          eq(approvalStepsTable.status, "pending"),
        ),
      )
      .orderBy(approvalStepsTable.stepOrder)
      .limit(1);
    await db
      .update(requisitionsTable)
      .set({
        status: next.length ? "pending_approval" : "approved",
        currentApprover: next[0]?.approver ?? null,
      })
      .where(eq(requisitionsTable.id, step.requisitionId));
  } else {
    await db
      .update(requisitionsTable)
      .set({
        status: parsed.data.decision === "reject" ? "rejected" : "changes_requested",
        currentApprover: null,
      })
      .where(eq(requisitionsTable.id, step.requisitionId));
  }
  await recordAuditEvent(org.id, req.currentUser?.name ?? "Unknown user", `Approval decision: ${parsed.data.decision}`, step.requisitionId, parsed.data.note ?? undefined);
  res.json(
    DecideApprovalResponse.parse({
      id: updatedStep?.id ?? step.id,
      requisitionId: step.requisitionId,
      requisitionNumber: "REQ",
      description: "Approval decision recorded",
      requester: "Requester",
      amountCents: 0,
      costCenter: "Unassigned",
      ageHours: 0,
      status: nextStatus,
    }),
  );
});

export default router;
