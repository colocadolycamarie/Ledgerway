import { useState } from 'react';
import { ArrowRight, Receipt, UploadCloud } from 'lucide-react';
import { Link } from 'wouter';
import { getListInvoicesQueryKey, useCreateInvoice, useListInvoices } from '@workspace/api-client';
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
import { formatCurrency, formatDate } from '@/lib/format';

export default function Invoices() {
  const query = useListInvoices(ORG_SLUG, {}); const create = useCreateInvoice(); const [open, setOpen] = useState(false); const [vendor, setVendor] = useState(''); const [number, setNumber] = useState(''); const [amount, setAmount] = useState(''); const [due, setDue] = useState('');
  return <><PageTitle title="Invoices" description="A single view of what is ready, matched, or asking for judgment." action={<ActionButton className="button-primary" onClick={() => setOpen(true)} data-testid="button-new-invoice"><UploadCloud size={16} /> Record invoice</ActionButton>} />{open && <InlineForm title="Record invoice" onClose={() => setOpen(false)} onSubmit={() => create.mutate({ orgSlug: ORG_SLUG, data: { vendorName: vendor, invoiceNumber: number, totalAmountCents: Number(amount) * 100, dueDate: due } }, { onSuccess: () => { setOpen(false); queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey(ORG_SLUG) }); } })}><label>Vendor<input value={vendor} onChange={(e) => setVendor(e.target.value)} required data-testid="input-invoice-vendor" /></label><label>Invoice number<input value={number} onChange={(e) => setNumber(e.target.value)} required data-testid="input-invoice-number" /></label><label>Total<input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required data-testid="input-invoice-amount" /></label><label>Due date<input type="date" value={due} onChange={(e) => setDue(e.target.value)} required data-testid="input-invoice-due-date" /></label></InlineForm>}<Panel>{query.isLoading ? <LoadingSkeleton /> : query.isError ? <ErrorState retry={() => query.refetch()} /> : query.data?.length ? <div className="data-table-wrap"><table><thead><tr><th>Invoice</th><th>Vendor</th><th>PO</th><th>Amount</th><th>Due</th><th>Match</th><th /></tr></thead><tbody>{query.data.map((invoice) => <tr key={invoice.id} data-testid={`row-invoice-${invoice.id}`}><td className="table-primary"><Link href={`/app/ledgerway/invoices/${invoice.id}/match`} data-testid={`link-invoice-match-${invoice.id}`}>{invoice.invoiceNumber}</Link><small><StatusBadge value={invoice.status} /></small></td><td>{invoice.vendorName}</td><td>{invoice.purchaseOrderNumber || 'Unlinked'}</td><td className="amount">{formatCurrency(invoice.totalAmountCents)}</td><td>{formatDate(invoice.dueDate)}</td><td><StatusBadge value={invoice.matchStatus} /></td><td><Link href={`/app/ledgerway/invoices/${invoice.id}/match`} className="table-arrow" data-testid={`link-match-${invoice.id}`}><ArrowRight size={15} /></Link></td></tr>)}</tbody></table></div> : <EmptyState icon={Receipt} title="No invoices in the queue" text="Record an invoice to begin its match and payment path." />}</Panel></>;
}
