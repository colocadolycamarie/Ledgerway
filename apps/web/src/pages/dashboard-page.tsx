import { ArrowRight, ClipboardCheck, Plus } from 'lucide-react';
import { Link } from 'wouter';
import { useGetDashboard } from '@workspace/api-client';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Panel } from '@/components/shared/panel';
import { PageTitle } from '@/components/shared/page-title';
import { AccountingBanner } from '@/components/shared/accounting-banner';
import { ORG_SLUG } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/format';

export default function Dashboard() {
  const query = useGetDashboard(ORG_SLUG);
  if (query.isLoading) return <><PageTitle title="Overview" /><LoadingSkeleton rows={5} /></>;
  if (query.isError || !query.data) return <><PageTitle title="Overview" /><ErrorState retry={() => query.refetch()} /></>;
  const d = query.data;
  return <><AccountingBanner /><PageTitle eyebrow={d.organization} title="Good morning, Alex." description="Here’s where spend stands across your control chain." action={<Link href="/app/ledgerway/requisitions/new" className="button button-primary" data-testid="link-new-requisition"><Plus size={16} /> New requisition</Link>} /><div className="metrics-grid">{[['Allocated', formatCurrency(d.metrics.allocatedCents), 'Full-year budget'], ['Committed', formatCurrency(d.metrics.committedCents), 'Approved, not yet paid'], ['Spent', formatCurrency(d.metrics.spentCents), 'Paid and posted'], ['Remaining', formatCurrency(d.metrics.remainingCents), 'Available to commit']].map(([label, value, note], i) => <Panel key={label} className={`metric-card metric-${i}`}><p>{label}</p><strong data-testid={`metric-${String(label).toLowerCase()}`}>{value}</strong><small>{note}</small><span className="metric-rule" /></Panel>)}</div><div className="dashboard-columns"><Panel><div className="card-heading"><div><p className="eyebrow">Needs your attention</p><h2>Approval queue</h2></div><Link href="/app/ledgerway/approvals" className="text-link" data-testid="link-view-approvals">View queue <ArrowRight size={14} /></Link></div>{d.attention.length ? <div className="attention-list">{d.attention.slice(0, 5).map((item) => <Link href={`/app/ledgerway/requisitions/${item.requisitionId}`} className="attention-item" key={item.id} data-testid={`row-attention-${item.id}`}><span className="attention-icon"><ClipboardCheck size={16} /></span><span><strong>{item.requisitionNumber}</strong><small>{item.description} · {item.requester}</small></span><b>{formatCurrency(item.amountCents)}<small>{item.ageHours}h waiting</small></b><ArrowRight size={15} /></Link>)}</div> : <EmptyState icon={ClipboardCheck} title="Queue is clear" text="No approval decisions are waiting on you." />}</Panel><Panel><div className="card-heading"><div><p className="eyebrow">Recent evidence</p><h2>Activity trail</h2></div><Link href="/app/ledgerway/audit-log" className="text-link" data-testid="link-view-audit">Full audit log <ArrowRight size={14} /></Link></div><div className="timeline">{d.activity.slice(0, 6).map((event) => <div className="timeline-item" key={event.id} data-testid={`event-activity-${event.id}`}><span className="timeline-dot" /><div><strong>{event.action}</strong><p>{event.actor} · {event.target}</p><small>{formatDate(event.createdAt)}</small></div></div>)}</div></Panel></div></>;
}
