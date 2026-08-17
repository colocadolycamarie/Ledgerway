import { useState } from 'react';
import { ArrowRight, FilePlus2, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { Link } from 'wouter';
import { useListRequisitions } from '@workspace/api-client';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Panel } from '@/components/shared/panel';
import { PageTitle } from '@/components/shared/page-title';
import { ORG_SLUG } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/format';

export default function Requisitions() {
  const [search, setSearch] = useState('');
  const query = useListRequisitions(ORG_SLUG, { search: search || undefined });
  return <><PageTitle title="Requisitions" description="Every request, with its owner, purpose, and next decision." action={<Link href="/app/ledgerway/requisitions/new" className="button button-primary" data-testid="link-new-requisition"><Plus size={16} /> New requisition</Link>} /><Panel><div className="toolbar"><div className="search-input"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requisitions" data-testid="input-search-requisitions" /></div><button className="filter-button" disabled title="Advanced filters are coming soon" aria-label="Filters (coming soon)" data-testid="button-filter-requisitions"><SlidersHorizontal size={15} /> Filters</button><span className="toolbar-spacer" /><span className="muted-label">{query.data?.length || 0} records</span></div>{query.isLoading ? <LoadingSkeleton /> : query.isError ? <ErrorState retry={() => query.refetch()} /> : query.data?.length ? <div className="data-table-wrap"><table><thead><tr><th>Request</th><th>Requester</th><th>Amount</th><th>Needed by</th><th>Status</th><th /></tr></thead><tbody>{query.data.map((r) => <tr key={r.id} data-testid={`row-requisition-${r.id}`}><td><Link href={`/app/ledgerway/requisitions/${r.id}`} className="table-primary" data-testid={`link-requisition-${r.id}`}>{r.number}</Link><small>{r.description}</small></td><td>{r.requester}<small>{r.costCenter}</small></td><td className="amount">{formatCurrency(r.estimatedAmountCents, r.currency)}</td><td>{formatDate(r.neededByDate)}</td><td><StatusBadge value={r.status} /></td><td><ArrowRight size={15} className="table-arrow" /></td></tr>)}</tbody></table></div> : <EmptyState icon={FilePlus2} title="No requisitions yet" text="Start a request and Ledgerway will keep the evidence moving." action={<Link href="/app/ledgerway/requisitions/new" className="button button-primary" data-testid="link-empty-new-requisition"><Plus size={15} /> New requisition</Link>} />}</Panel></>;
}
