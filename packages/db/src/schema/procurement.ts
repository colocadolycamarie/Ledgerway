import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const organizationsTable = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  baseCurrency: text("base_currency").notNull().default("USD"),
  plan: text("plan").notNull().default("business"),
  ...timestamps,
});

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("requester"),
  ...timestamps,
});

export const costCentersTable = pgTable("cost_centers", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  name: text("name").notNull(),
  ...timestamps,
});

export const categoriesTable = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  name: text("name").notNull(),
  ...timestamps,
});

export const budgetsTable = pgTable("budgets", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  label: text("label").notNull(),
  costCenter: text("cost_center").notNull(),
  category: text("category").notNull(),
  allocatedCents: integer("allocated_cents").notNull(),
  committedCents: integer("committed_cents").notNull().default(0),
  spentCents: integer("spent_cents").notNull().default(0),
  rolloverEnabled: boolean("rollover_enabled").notNull().default(false),
  ...timestamps,
});

export const requisitionsTable = pgTable("requisitions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  number: text("number").notNull(),
  requester: text("requester").notNull(),
  description: text("description").notNull(),
  estimatedAmountCents: integer("estimated_amount_cents").notNull(),
  currency: text("currency").notNull().default("USD"),
  costCenter: text("cost_center").notNull(),
  category: text("category").notNull(),
  neededByDate: date("needed_by_date", { mode: "string" }).notNull(),
  status: text("status").notNull().default("draft"),
  currentApprover: text("current_approver"),
  justification: text("justification"),
  vendorName: text("vendor_name"),
  ...timestamps,
});

export const approvalStepsTable = pgTable("approval_steps", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  requisitionId: uuid("requisition_id")
    .notNull()
    .references(() => requisitionsTable.id),
  stepOrder: integer("step_order").notNull(),
  approver: text("approver").notNull(),
  status: text("status").notNull().default("pending"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  note: text("note"),
  ...timestamps,
});

export const purchaseOrdersTable = pgTable("purchase_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  requisitionId: uuid("requisition_id").references(() => requisitionsTable.id),
  number: text("number").notNull(),
  vendorName: text("vendor_name").notNull(),
  costCenter: text("cost_center").notNull(),
  totalAmountCents: integer("total_amount_cents").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("draft"),
  lineItems: jsonb("line_items").notNull().default([]),
  issuedAt: timestamp("issued_at", { withTimezone: true }),
  ...timestamps,
});

export const vendorsTable = pgTable("vendors", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  paymentTerms: text("payment_terms").notNull().default("Net 30"),
  preferred: boolean("preferred").notNull().default(false),
  spendCents: integer("spend_cents").notNull().default(0),
  exceptionRate: numeric("exception_rate").notNull().default("0"),
  onTimeRate: numeric("on_time_rate").notNull().default("0"),
  ...timestamps,
});

export const receivingRecordsTable = pgTable("receiving_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  purchaseOrderId: uuid("purchase_order_id")
    .notNull()
    .references(() => purchaseOrdersTable.id),
  quantity: numeric("quantity").notNull(),
  conditionNotes: text("condition_notes").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  ...timestamps,
});

export const invoicesTable = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  vendorName: text("vendor_name").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  purchaseOrderId: uuid("purchase_order_id").references(
    () => purchaseOrdersTable.id,
  ),
  totalAmountCents: integer("total_amount_cents").notNull(),
  dueDate: date("due_date", { mode: "string" }).notNull(),
  status: text("status").notNull().default("pending_review"),
  matchStatus: text("match_status").notNull().default("not_run"),
  lineItems: jsonb("line_items").notNull().default([]),
  ...timestamps,
});

export const paymentBatchesTable = pgTable("payment_batches", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  number: text("number").notNull(),
  invoiceIds: jsonb("invoice_ids").notNull().default([]),
  invoiceCount: integer("invoice_count").notNull(),
  totalAmountCents: integer("total_amount_cents").notNull(),
  status: text("status").notNull().default("draft"),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  ...timestamps,
});

export const approvalPoliciesTable = pgTable("approval_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  name: text("name").notNull(),
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  rules: jsonb("rules").notNull().default([]),
  ...timestamps,
});

export const auditLogsTable = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizationsTable.id),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  target: text("target").notNull(),
  metadata: text("metadata"),
  ...timestamps,
});

export const insertRequisitionSchema = createInsertSchema(requisitionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertVendorSchema = createInsertSchema(vendorsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Requisition = typeof requisitionsTable.$inferSelect;
export type PurchaseOrder = typeof purchaseOrdersTable.$inferSelect;
export type Invoice = typeof invoicesTable.$inferSelect;
export type Vendor = typeof vendorsTable.$inferSelect;
export type InsertRequisition = z.infer<typeof insertRequisitionSchema>;