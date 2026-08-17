import { and, eq, ilike } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { CreateVendorBody, CreateVendorResponse, ListVendorsQueryParams, ListVendorsResponse } from "@workspace/api-schema";
import { db, vendorsTable } from "@workspace/db";
import { getOrganization, rawParam, recordAuditEvent } from "../lib/route-helpers";

const router: IRouter = Router();

router.get("/orgs/:orgSlug/vendors", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  const query = ListVendorsQueryParams.parse(req.query);
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  const filters = [eq(vendorsTable.organizationId, org.id)];
  if (query.search) filters.push(ilike(vendorsTable.name, `%${query.search}%`));
  const rows = await db
    .select()
    .from(vendorsTable)
    .where(and(...filters))
    .orderBy(vendorsTable.name);
  res.json(
    ListVendorsResponse.parse(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        status: row.status,
        paymentTerms: row.paymentTerms,
        spendCents: row.spendCents,
        exceptionRate: Number(row.exceptionRate),
        onTimeRate: Number(row.onTimeRate),
      })),
    ),
  );
});

router.post("/orgs/:orgSlug/vendors", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  const parsed = CreateVendorBody.safeParse(req.body);
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(vendorsTable)
    .values({
      organizationId: org.id,
      name: parsed.data.name,
      paymentTerms: parsed.data.paymentTerms,
      preferred: parsed.data.preferred ?? false,
    })
    .returning();
  if (!row) {
    res.status(500).json({ error: "Could not create vendor" });
    return;
  }
  await recordAuditEvent(org.id, req.currentUser?.name ?? "Unknown user", "Created vendor", row.name);
  res.status(201).json(
    CreateVendorResponse.parse({
      id: row.id,
      name: row.name,
      status: row.status,
      paymentTerms: row.paymentTerms,
      spendCents: row.spendCents,
      exceptionRate: Number(row.exceptionRate),
      onTimeRate: Number(row.onTimeRate),
    }),
  );
});

export default router;
