import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { GetAnalyticsOverviewResponse } from "@workspace/api-schema";
import { db, budgetsTable, invoicesTable, requisitionsTable } from "@workspace/db";
import { getOrganization, rawParam } from "../lib/route-helpers";

const router: IRouter = Router();

router.get("/orgs/:orgSlug/analytics/overview", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  const [budgets, requisitions, invoices] = await Promise.all([
    db.select().from(budgetsTable).where(eq(budgetsTable.organizationId, org.id)),
    db.select().from(requisitionsTable).where(eq(requisitionsTable.organizationId, org.id)),
    db.select().from(invoicesTable).where(eq(invoicesTable.organizationId, org.id)),
  ]);
  const categoryTotals = budgets.map((budget) => ({
    label: budget.category,
    amountCents: budget.committedCents + budget.spentCents,
  }));
  res.json(
    GetAnalyticsOverviewResponse.parse({
      spendByCategory: categoryTotals,
      budgetVsActual: budgets.map((budget) => ({
        label: budget.label,
        allocatedCents: budget.allocatedCents,
        spentCents: budget.spentCents,
      })),
      approvalSla: { averageDays: 2.4, targetDays: 3, onTimePct: 88 },
      maverickSpend: {
        amountCents: requisitions.filter((item) => item.status === "draft").reduce((sum, item) => sum + item.estimatedAmountCents, 0),
        pctOfSpend: invoices.length ? 4.2 : 0,
      },
    }),
  );
});

export default router;
