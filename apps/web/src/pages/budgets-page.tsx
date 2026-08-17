import { CircleDollarSign } from 'lucide-react';
import { useListBudgets } from '@workspace/api-client';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ActionButton } from '@/components/shared/action-button';
import { Panel } from '@/components/shared/panel';
import { PageTitle } from '@/components/shared/page-title';
import { ORG_SLUG } from '@/lib/constants';
import { formatCurrency } from '@/lib/format';

export default function Budgets() {
  const query = useListBudgets(ORG_SLUG); return <><PageTitle title="Budgets" description="Commitment visibility by the dimensions your team actually manages." /><Panel>{query.isLoading ? <LoadingSkeleton /> : query.isError ? <ErrorState retry={() => query.refetch()} /> : query.data?.length ? <div className="budget-list">{query.data.map((b) => <div className="budget-row" key={b.id} data-testid={`row-budget-${b.id}`}><div className="budget-label"><strong>{b.label}</strong><small>{b.costCenter} · {b.category}</small></div><div className="budget-number"><span>Remaining</span><strong>{formatCurrency(b.remainingCents)}</strong></div><div className="budget-progress"><div><span style={{ width: `${Math.min(b.utilizationPct, 100)}%` }} /></div><small>{b.utilizationPct.toFixed(1)}% utilized · {formatCurrency(b.allocatedCents)} allocated</small></div></div>)}</div> : <EmptyState icon={CircleDollarSign} title="No budgets configured" text="Connect your accounting dimensions or add a budget policy to start controlling spend." action={<ActionButton className="button-secondary" disabled title="Accounting integrations are coming soon" aria-label="Connect accounting system (coming soon)" data-testid="button-connect-budget-system">Connect accounting system</ActionButton>} />}</Panel></>;
}
