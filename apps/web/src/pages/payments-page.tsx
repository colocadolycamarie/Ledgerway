import { ArrowRight, Plus, WalletCards } from 'lucide-react';
import { getListPaymentBatchesQueryKey, useCreatePaymentBatch, useExportPaymentBatch, useListInvoices, useListPaymentBatches } from '@workspace/api-client';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ActionButton } from '@/components/shared/action-button';
import { Panel } from '@/components/shared/panel';
import { PageTitle } from '@/components/shared/page-title';
import { ORG_SLUG } from '@/lib/constants';
import { queryClient } from '@/lib/query-client';
import { formatCurrency, formatDate } from '@/lib/format';

export default function Payments() {
  const invoices = useListInvoices(ORG_SLUG, { status: 'matched' }); const batches = useListPaymentBatches(ORG_SLUG); const create = useCreatePaymentBatch(); const exportBatch = useExportPaymentBatch();
  const createBatch = () => create.mutate({ orgSlug: ORG_SLUG, data: { invoiceIds: (invoices.data || []).map((i) => i.id) } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListPaymentBatchesQueryKey(ORG_SLUG) }) });
  return <><PageTitle title="Payments" description="Release only invoices that have earned their way through control." action={<ActionButton className="button-primary" onClick={createBatch} disabled={!invoices.data?.length || create.isPending} data-testid="button-create-payment-batch"><Plus size={16} /> Create payment batch</ActionButton>} /><div className="payment-banner"><WalletCards size={18} /><div><strong>Accounting system not connected</strong><p>Export files are available for review, but Ledgerway will not pretend they have posted.</p></div><ActionButton className="button-secondary ml-auto" disabled title="Accounting integrations are coming soon" aria-label="Connect accounting (coming soon)" data-testid="button-connect-payments">Connect accounting <ArrowRight size={14} /></ActionButton></div><Panel><div className="card-heading"><div><p className="eyebrow">Release history</p><h2>Payment batches</h2></div></div>{batches.isLoading ? <LoadingSkeleton /> : batches.isError ? <ErrorState retry={() => batches.refetch()} /> : batches.data?.length ? <div className="data-table-wrap"><table><thead><tr><th>Batch</th><th>Invoices</th><th>Total</th><th>Created</th><th>Status</th><th /></tr></thead><tbody>{batches.data.map((batch) => <tr key={batch.id} data-testid={`row-payment-batch-${batch.id}`}><td className="table-primary">{batch.number}</td><td>{batch.invoiceCount}</td><td className="amount">{formatCurrency(batch.totalAmountCents)}</td><td>{formatDate(batch.createdAt)}</td><td><StatusBadge value={batch.status} /></td><td><ActionButton className="button-small button-secondary" onClick={() => exportBatch.mutate({ orgSlug: ORG_SLUG, batchId: batch.id })} data-testid={`button-export-batch-${batch.id}`}><ArrowRight size={13} /> Export</ActionButton></td></tr>)}</tbody></table></div> : <EmptyState icon={WalletCards} title="No payment batches" text="Matched invoices will appear here when you create a release batch." />}</Panel></>;
}
