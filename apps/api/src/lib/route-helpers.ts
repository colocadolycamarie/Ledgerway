import { eq } from "drizzle-orm";
import { CreateRequisitionResponse, GetRequisitionResponse } from "@workspace/api-schema";
import { db, approvalStepsTable, auditLogsTable, organizationsTable } from "@workspace/db";
import type { Requisition } from "@workspace/db";

export type LineItem = {
  description: string;
  quantity: number;
  unitPriceCents: number;
  glCode?: string | null;
};

/** Express route params can be a single value or an array; normalize to a string. */
export function rawParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export function toDateString(value: Date | string): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value;
}

export function asLines(value: unknown): LineItem[] {
  return Array.isArray(value) ? (value as LineItem[]) : [];
}

export async function getOrganization(slug: string) {
  const [org] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.slug, slug))
    .limit(1);
  return org;
}

export async function recordAuditEvent(
  orgId: string,
  actor: string,
  action: string,
  target: string,
  metadata?: string,
) {
  await db.insert(auditLogsTable).values({
    organizationId: orgId,
    actor,
    action,
    target,
    metadata,
  });
}

export function toRequisitionResponse(row: Requisition) {
  return CreateRequisitionResponse.parse({
    id: row.id,
    number: row.number,
    description: row.description,
    estimatedAmountCents: row.estimatedAmountCents,
    currency: row.currency,
    costCenter: row.costCenter,
    category: row.category,
    requester: row.requester,
    neededByDate: new Date(`${row.neededByDate}T00:00:00Z`),
    status: row.status,
    createdAt: row.createdAt,
    currentApprover: row.currentApprover,
    justification: row.justification,
  });
}

export async function toRequisitionDetailResponse(row: Requisition) {
  const steps = await db
    .select()
    .from(approvalStepsTable)
    .where(eq(approvalStepsTable.requisitionId, row.id))
    .orderBy(approvalStepsTable.stepOrder);
  return GetRequisitionResponse.parse({
    ...toRequisitionResponse(row),
    approvalSteps: steps.map((step) => ({
      id: step.id,
      order: step.stepOrder,
      approver: step.approver,
      status: step.status,
      decidedAt: step.decidedAt,
      note: step.note,
    })),
  });
}
