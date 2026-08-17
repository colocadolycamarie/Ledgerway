import { and, desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { GetDashboardResponse } from "@workspace/api-schema";
import {
  db,
  approvalStepsTable,
  auditLogsTable,
  budgetsTable,
  invoicesTable,
  requisitionsTable,
} from "@workspace/db";
import { getOrganization, rawParam } from "../lib/route-helpers";

const router: IRouter = Router();

router.get("/orgs/:orgSlug/dashboard", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  const [budgets, pendingSteps, exceptions, activity] = await Promise.all([
    db.select().from(budgetsTable).where(eq(budgetsTable.organizationId, org.id)),
    db
      .select()
      .from(approvalStepsTable)
      .where(
        and(
          eq(approvalStepsTable.organizationId, org.id),
          eq(approvalStepsTable.status, "pending"),
        ),
      ),
    db
      .select()
      .from(invoicesTable)
      .where(
        and(
          eq(invoicesTable.organizationId, org.id),
          eq(invoicesTable.status, "exception"),
        ),
      ),
    db
      .select()
      .from(auditLogsTable)
      .where(eq(auditLogsTable.organizationId, org.id))
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(8),
  ]);
  const requisitions = await db
    .select()
    .from(requisitionsTable)
    .where(eq(requisitionsTable.organizationId, org.id))
    .orderBy(desc(requisitionsTable.createdAt))
    .limit(8);
  const attention = pendingSteps.map((step) => {
    const requisition = requisitions.find((item) => item.id === step.requisitionId);
    return {
      id: step.id,
      requisitionId: step.requisitionId,
      requisitionNumber: requisition?.number ?? "REQ—",
      description: requisition?.description ?? "Approval request",
      requester: requisition?.requester ?? "Requester",
      amountCents: requisition?.estimatedAmountCents ?? 0,
      costCenter: requisition?.costCenter ?? "Unassigned",
      ageHours: Math.max(1, (Date.now() - step.createdAt.getTime()) / 3_600_000),
      status: step.status,
    };
  });
  res.json(
    GetDashboardResponse.parse({
      organization: org.name,
      metrics: {
        allocatedCents: budgets.reduce((sum, item) => sum + item.allocatedCents, 0),
        committedCents: budgets.reduce((sum, item) => sum + item.committedCents, 0),
        spentCents: budgets.reduce((sum, item) => sum + item.spentCents, 0),
        remainingCents: budgets.reduce(
          (sum, item) => sum + item.allocatedCents - item.committedCents - item.spentCents,
          0,
        ),
        pendingApprovalCount: pendingSteps.length,
        exceptionCount: exceptions.length,
      },
      attention,
      activity: activity.map((item) => ({
        id: item.id,
        actor: item.actor,
        action: item.action,
        target: item.target,
        metadata: item.metadata,
        createdAt: item.createdAt,
      })),
    }),
  );
});

export default router;
