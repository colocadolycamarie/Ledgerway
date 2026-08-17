import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { ListApprovalPoliciesResponse } from "@workspace/api-schema";
import { db, approvalPoliciesTable } from "@workspace/db";
import { getOrganization, rawParam } from "../lib/route-helpers";

const router: IRouter = Router();

router.get("/orgs/:orgSlug/settings/approval-policies", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  const rows = await db
    .select()
    .from(approvalPoliciesTable)
    .where(eq(approvalPoliciesTable.organizationId, org.id));
  res.json(
    ListApprovalPoliciesResponse.parse(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        version: row.version,
        isActive: row.isActive,
        rules: Array.isArray(row.rules) ? row.rules : [],
      })),
    ),
  );
});

export default router;
