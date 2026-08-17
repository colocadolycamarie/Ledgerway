import { ArrowLeft, Check, Send } from 'lucide-react';
import { Link, useParams } from 'wouter';
import { getGetRequisitionQueryKey, useGetRequisition, useSubmitRequisition, useWithdrawRequisition } from '@workspace/api-client';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { ActionButton } from '@/components/shared/action-button';
import { Panel } from '@/components/shared/panel';
import { PageTitle } from '@/components/shared/page-title';
import { ORG_SLUG } from '@/lib/constants';
import { queryClient } from '@/lib/query-client';
import { formatCurrency, formatDate } from '@/lib/format';

export default function RequisitionDetail() {
  const { id = '' } = useParams<{ id: string }>(); const query = useGetRequisition(ORG_SLUG, id); const submit = useSubmitRequisition(); const withdraw = useWithdrawRequisition();
  if (query.isLoading) return <><PageTitle title="Requisition" /><LoadingSkeleton rows={6} /></>; if (query.isError || !query.data) return <ErrorState retry={() => query.refetch()} />; const r = query.data;
  return <><Link href="/app/ledgerway/requisitions" className="back-link" data-testid="link-back-requisitions"><ArrowLeft size={15} /> Requisitions</Link><PageTitle eyebrow={r.number} title={r.description} description={`Created ${formatDate(r.createdAt)} by ${r.requester}`} action={<StatusBadge value={r.status} />} /><div className="detail-grid"><Panel><div className="card-heading"><div><p className="eyebrow">Request record</p><h2>Purchase context</h2></div></div><div className="detail-facts"><div><span>Estimated amount</span><strong>{formatCurrency(r.estimatedAmountCents, r.currency)}</strong></div><div><span>Cost center</span><strong>{r.costCenter}</strong></div><div><span>Category</span><strong>{r.category}</strong></div><div><span>Needed by</span><strong>{formatDate(r.neededByDate)}</strong></div></div><div className="justification"><span>Justification</span><p>{r.justification || 'No justification provided.'}</p></div><div className="form-actions">{r.status === 'draft' && <ActionButton className="button-primary" onClick={() => submit.mutate({ orgSlug: ORG_SLUG, requisitionId: r.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetRequisitionQueryKey(ORG_SLUG, id) }) })} data-testid="button-submit-detail">Submit for approval <Send size={14} /></ActionButton>}{r.status.includes('pending') && <ActionButton className="button-secondary" onClick={() => withdraw.mutate({ orgSlug: ORG_SLUG, requisitionId: r.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetRequisitionQueryKey(ORG_SLUG, id) }) })} data-testid="button-withdraw-requisition">Withdraw request</ActionButton>}</div></Panel><Panel><p className="eyebrow">Control chain</p><h2>Approval path</h2><div className="approval-chain">{r.approvalSteps.map((s) => <div className="chain-step" key={s.id}><span className={`chain-number ${s.status === 'approved' ? 'complete' : ''}`}>{s.status === 'approved' ? <Check size={14} /> : String(s.order).padStart(2, '0')}</span><div><strong>{s.approver}</strong><p>{s.status === 'approved' ? `Approved ${formatDate(s.decidedAt)}` : s.status === 'pending' ? 'Decision waiting' : s.status}</p>{s.note && <small>{s.note}</small>}</div><StatusBadge value={s.status} /></div>)}</div></Panel></div></>;
}
