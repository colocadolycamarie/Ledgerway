import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { getListVendorsQueryKey, useCreateVendor, useListVendors } from '@workspace/api-client';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ActionButton } from '@/components/shared/action-button';
import { Panel } from '@/components/shared/panel';
import { PageTitle } from '@/components/shared/page-title';
import { InlineForm } from '@/components/shared/inline-form';
import { ORG_SLUG } from '@/lib/constants';
import { queryClient } from '@/lib/query-client';
import { formatCurrency } from '@/lib/format';

export default function Vendors() {
  const query = useListVendors(ORG_SLUG, {}); const create = useCreateVendor(); const [open, setOpen] = useState(false); const [name, setName] = useState(''); const [terms, setTerms] = useState('Net 30');
  return <><PageTitle title="Vendors" description="Know who you are buying from, before the invoice arrives." action={<ActionButton className="button-primary" onClick={() => setOpen(true)} data-testid="button-new-vendor"><Plus size={16} /> Add vendor</ActionButton>} />{open && <InlineForm title="Add vendor" onClose={() => setOpen(false)} onSubmit={() => create.mutate({ orgSlug: ORG_SLUG, data: { name, paymentTerms: terms } }, { onSuccess: () => { setOpen(false); queryClient.invalidateQueries({ queryKey: getListVendorsQueryKey(ORG_SLUG) }); } })}><label>Vendor name<input value={name} onChange={(e) => setName(e.target.value)} required data-testid="input-vendor-name" /></label><label>Payment terms<select value={terms} onChange={(e) => setTerms(e.target.value)} data-testid="select-vendor-terms"><option>Net 15</option><option>Net 30</option><option>Net 45</option></select></label></InlineForm>}<Panel>{query.isLoading ? <LoadingSkeleton /> : query.isError ? <ErrorState retry={() => query.refetch()} /> : query.data?.length ? <div className="data-table-wrap"><table><thead><tr><th>Vendor</th><th>Status</th><th>Terms</th><th>Spend</th><th>Exceptions</th><th>On time</th></tr></thead><tbody>{query.data.map((v) => <tr key={v.id} data-testid={`row-vendor-${v.id}`}><td className="table-primary">{v.name}</td><td><StatusBadge value={v.status} /></td><td>{v.paymentTerms}</td><td className="amount">{formatCurrency(v.spendCents)}</td><td>{v.exceptionRate.toFixed(1)}%</td><td>{v.onTimeRate.toFixed(1)}%</td></tr>)}</tbody></table></div> : <EmptyState icon={Users} title="No vendors yet" text="Add a vendor when an approved request is ready to source." />}</Panel></>;
}
