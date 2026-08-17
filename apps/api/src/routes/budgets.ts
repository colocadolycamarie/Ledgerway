import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { ListBudgetsResponse } from "@workspace/api-schema";
import { db, budgetsTable } from "@workspace/db";
import { getOrganization, rawParam } from "../lib/route-helpers";

const router: IRouter = Router();

router.get("/orgs/:orgSlug/budgets", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  const rows = await db
    .select()
    .from(budgetsTable)
    .where(eq(budgetsTable.organizationId, org.id))
    .orderBy(budgetsTable.label);
  res.json(
    ListBudgetsResponse.parse(
      rows.map((row) => ({
        id: row.id,
        label: row.label,
        costCenter: row.costCenter,
        category: row.category,
        allocatedCents: row.allocatedCents,
        committedCents: row.committedCents,
        spentCents: row.spentCents,
        remainingCents: row.allocatedCents - row.committedCents - row.spentCents,
        utilizationPct:
          row.allocatedCents === 0
            ? 0
            : ((row.committedCents + row.spentCents) / row.allocatedCents) * 100,
      })),
    ),
  );
});

export default router;
