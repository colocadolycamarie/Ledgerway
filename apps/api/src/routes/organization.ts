import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { GetOrganizationResponse, UpdateOrganizationBody, UpdateOrganizationResponse } from "@workspace/api-schema";
import { db, organizationsTable } from "@workspace/db";
import { getOrganization, rawParam, recordAuditEvent } from "../lib/route-helpers";

const router: IRouter = Router();

router.get("/orgs/:orgSlug", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  res.json(GetOrganizationResponse.parse(org));
});

router.patch("/orgs/:orgSlug", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  const body = UpdateOrganizationBody.parse(req.body);
  const [updated] = await db
    .update(organizationsTable)
    .set({ name: body.name.trim() })
    .where(eq(organizationsTable.id, org.id))
    .returning();
  await recordAuditEvent(org.id, req.currentUser?.name ?? "Unknown user", "Renamed workspace", updated.name);
  res.json(UpdateOrganizationResponse.parse(updated));
});

export default router;
