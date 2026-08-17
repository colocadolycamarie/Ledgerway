import { and, desc, eq } from "drizzle-orm";
import { db, approvalPoliciesTable } from "@workspace/db";

export type ApprovalContext = {
  amountCents: number;
  costCenter: string;
  category: string;
};

type PolicyRule = { condition: string; chain: string[] };

const FIELDS = new Set(["amountCents", "costCenter", "category"]);
const CONDITION_PATTERN = /^(amountCents|costCenter|category)\s*(>=|<=|==|!=|>|<)\s*(.+)$/;

function compareNumbers(left: number, operator: string, right: number): boolean {
  switch (operator) {
    case ">":
      return left > right;
    case ">=":
      return left >= right;
    case "<":
      return left < right;
    case "<=":
      return left <= right;
    case "==":
      return left === right;
    case "!=":
      return left !== right;
    default:
      return false;
  }
}

function compareStrings(left: string, operator: string, right: string): boolean {
  if (operator === "==") return left === right;
  if (operator === "!=") return left !== right;
  return false;
}

/**
 * Evaluates a single policy rule's `condition` against a requisition's
 * context, e.g. "amountCents > 500000" or "category == 'Software'".
 *
 * Deliberately supports only this small, fixed grammar (one field, one
 * comparison operator, one literal) rather than a general expression
 * evaluator — policy conditions are stored as free text in the database,
 * and this avoids ever evaluating them as code.
 */
export function evaluateCondition(condition: string, context: ApprovalContext): boolean {
  const trimmed = condition.trim();
  if (trimmed === "" || trimmed === "*" || trimmed.toLowerCase() === "true") return true;

  const match = trimmed.match(CONDITION_PATTERN);
  if (!match) return false;
  const [, field, operator, rawValue] = match;
  if (!FIELDS.has(field)) return false;

  const value = rawValue.trim().replace(/^['"]|['"]$/g, "");
  if (field === "amountCents") {
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? false : compareNumbers(context.amountCents, operator, numericValue);
  }
  const left = field === "costCenter" ? context.costCenter : context.category;
  return compareStrings(left, operator, value);
}

/**
 * Resolves which approvers a requisition should route through, based on
 * the organization's active approval policy. Falls back to the first rule
 * (or an empty chain, if the org has no policy configured) when nothing
 * matches — a requisition should never silently fail to route.
 */
export async function resolveApprovalChain(orgId: string, context: ApprovalContext): Promise<string[]> {
  const [policy] = await db
    .select()
    .from(approvalPoliciesTable)
    .where(and(eq(approvalPoliciesTable.organizationId, orgId), eq(approvalPoliciesTable.isActive, true)))
    .orderBy(desc(approvalPoliciesTable.version))
    .limit(1);
  if (!policy) return [];

  const rules = Array.isArray(policy.rules) ? (policy.rules as PolicyRule[]) : [];
  const matched = rules.find((rule) => evaluateCondition(rule.condition, context));
  return matched?.chain ?? rules[0]?.chain ?? [];
}
