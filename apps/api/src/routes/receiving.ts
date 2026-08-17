import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { CreateReceivingRecordBody, CreateReceivingRecordResponse } from "@workspace/api-schema";
import { db, purchaseOrdersTable, receivingRecordsTable } from "@workspace/db";
import { getOrganization, rawParam, recordAuditEvent } from "../lib/route-helpers";

const router: IRouter = Router();

router.post("/orgs/:orgSlug/receiving", async (req, res): Promise<void> => {
  const org = await getOrganization(rawParam(req.params.orgSlug));
  const parsed = CreateReceivingRecordBody.safeParse(req.body);
  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(receivingRecordsTable)
    .values({
      organizationId: org.id,
      purchaseOrderId: parsed.data.purchaseOrderId,
      quantity: String(parsed.data.quantity),
      conditionNotes: parsed.data.conditionNotes,
    })
    .returning();
  if (!row) {
    res.status(500).json({ error: "Could not record receiving" });
    return;
  }
  await db
    .update(purchaseOrdersTable)
    .set({ status: "partially_received" })
    .where(eq(purchaseOrdersTable.id, row.purchaseOrderId));
  await recordAuditEvent(org.id, req.currentUser?.name ?? "Unknown user", "Recorded receiving", row.purchaseOrderId);
  res.status(201).json(
    CreateReceivingRecordResponse.parse({
      id: row.id,
      purchaseOrderId: row.purchaseOrderId,
      quantity: Number(row.quantity),
      receivedAt: row.receivedAt,
      conditionNotes: row.conditionNotes,
    }),
  );
});

export default router;
