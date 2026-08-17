import { desc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { ListAuditLogResponse } from "@workspace/api-schema";
import { db, auditLogsTable } from "@workspace/db";
import { getOrganization, rawParam } from "../lib/route-helpers";

const router: IRouter = Router();

router.get("/orgs/:orgSlug/audit-log", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  const rows = await db
    .select()
    .from(auditLogsTable)
    .where(eq(auditLogsTable.organizationId, org.id))
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(100);
  res.json(
    ListAuditLogResponse.parse(
      rows.map((row) => ({
        id: row.id,
        actor: row.actor,
        action: row.action,
        target: row.target,
        metadata: row.metadata,
        createdAt: row.createdAt,
      })),
    ),
  );
});

export default router;
