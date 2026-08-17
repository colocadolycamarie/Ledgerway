import { useState } from 'react';
import { Plus, Send, ShoppingCart } from 'lucide-react';
import { getListPurchaseOrdersQueryKey, useCreatePurchaseOrder, useIssuePurchaseOrder, useListPurchaseOrders } from '@workspace/api-client';
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

export default function PurchaseOrders() {
  const query = useListPurchaseOrders(ORG_SLUG, {}); const issue = useIssuePurchaseOrder(); const create = useCreatePurchaseOrder(); const [open, setOpen] = useState(false); const [vendor, setVendor] = useState(''); const [amount, setAmount] = useState('');
  return <><PageTitle title="Purchase orders" description="Turn approved intent into an accountable commitment." action={<ActionButton className="button-primary" onClick={() => setOpen(true)} data-testid="button-new-purchase-order"><Plus size={16} /> New PO</ActionButton>} />{open && <InlineForm title="Create purchase order" onClose={() => setOpen(false)} onSubmit={() => create.mutate({ orgSlug: ORG_SLUG, data: { vendorName: vendor, costCenter: 'CC-410', lineItems: [{ description: 'Purchase order line', quantity: 1, unitPriceCents: Number(amount) * 100 }] } }, { onSuccess: () => { setOpen(false); queryClient.invalidateQueries({ queryKey: getListPurchaseOrdersQueryKey(ORG_SLUG) }); } })}><label>Vendor<input value={vendor} onChange={(e) => setVendor(e.target.value)} required data-testid="input-po-vendor" /></label><label>Total amount<input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required data-testid="input-po-amount" /></label></InlineForm>}<Panel>{query.isLoading ? <LoadingSkeleton /> : query.isError ? <ErrorState retry={() => query.refetch()} /> : query.data?.length ? <div className="data-table-wrap"><table><thead><tr><th>PO number</th><th>Vendor</th><th>Amount</th><th>Issued</th><th>Status</th><th /></tr></thead><tbody>{query.data.map((po) => <tr key={po.id} data-testid={`row-purchase-order-${po.id}`}><td className="table-primary">{po.number}<small>{po.lineItems.length} line items</small></td><td>{po.vendorName}</td><td className="amount">{formatCurrency(po.totalAmountCents, po.currency)}</td><td>{formatDate(po.issuedAt)}</td><td><StatusBadge value={po.status} /></td><td>{po.status === 'draft' && <ActionButton className="button-small button-secondary" onClick={() => issue.mutate({ orgSlug: ORG_SLUG, purchaseOrderId: po.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListPurchaseOrdersQueryKey(ORG_SLUG) }) })} data-testid={`button-issue-po-${po.id}`}>Issue <Send size={13} /></ActionButton>}</td></tr>)}</tbody></table></div> : <EmptyState icon={ShoppingCart} title="No purchase orders" text="Approved requisitions are ready to become commitments." />}</Panel></>;
}
