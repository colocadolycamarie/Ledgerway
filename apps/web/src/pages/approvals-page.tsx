import { useState } from 'react';
import { ArrowLeft, Check, ClipboardCheck, Clock3, X } from 'lucide-react';
import { Link } from 'wouter';
import { getListApprovalQueueQueryKey, useDecideApproval, useListApprovalQueue } from '@workspace/api-client';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ActionButton } from '@/components/shared/action-button';
import { Panel } from '@/components/shared/panel';
import { PageTitle } from '@/components/shared/page-title';
import { ORG_SLUG } from '@/lib/constants';
import { queryClient } from '@/lib/query-client';
import { formatCurrency } from '@/lib/format';

export default function Approvals() {
  const query = useListApprovalQueue(ORG_SLUG); const decide = useDecideApproval(); const [note, setNote] = useState('');
  const action = (id: string, decision: 'approve' | 'reject' | 'request_changes') => decide.mutate({ orgSlug: ORG_SLUG, stepId: id, data: { decision, note: note || null } }, { onSuccess: () => { setNote(''); queryClient.invalidateQueries({ queryKey: getListApprovalQueueQueryKey(ORG_SLUG) }); } });
  return <><PageTitle eyebrow="Decision queue" title="Approvals" description="Make informed decisions without opening another system." /><Panel><div className="queue-summary"><div><span className="eyebrow">Assigned to you</span><strong>{query.data?.length || 0}</strong><p>requests waiting for a decision</p></div><div className="queue-rule" /><div className="queue-sla"><Clock3 size={17} /><span>Target response time<strong>48 hours</strong></span></div></div>{query.isLoading ? <LoadingSkeleton /> : query.isError ? <ErrorState retry={() => query.refetch()} /> : query.data?.length ? <div className="approval-queue">{query.data.map((item) => <div className="approval-row" key={item.id} data-testid={`row-approval-${item.id}`}><div className="approval-main"><span className="attention-icon"><ClipboardCheck size={16} /></span><div><Link href={`/app/ledgerway/requisitions/${item.requisitionId}`} className="table-primary" data-testid={`link-approval-${item.id}`}>{item.requisitionNumber}</Link><h3>{item.description}</h3><p>{item.requester} · {item.costCenter}</p></div></div><div className="approval-amount"><strong>{formatCurrency(item.amountCents)}</strong><small className={item.ageHours > 36 ? 'text-danger' : ''}>{item.ageHours} hours waiting</small></div><div className="approval-actions"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional decision note" data-testid={`input-approval-note-${item.id}`} /><ActionButton className="button-approve" onClick={() => action(item.id, 'approve')} disabled={decide.isPending} data-testid={`button-approve-${item.id}`}><Check size={14} /> Approve</ActionButton><ActionButton className="button-icon-danger" onClick={() => action(item.id, 'request_changes')} disabled={decide.isPending} data-testid={`button-request-changes-${item.id}`}><ArrowLeft size={14} /></ActionButton><ActionButton className="button-icon-danger" onClick={() => action(item.id, 'reject')} disabled={decide.isPending} data-testid={`button-reject-${item.id}`}><X size={14} /></ActionButton></div></div>)}</div> : <EmptyState icon={ClipboardCheck} title="Your queue is clear" text="When a policy routes a request to you, it will appear here." />}</Panel></>;
}
