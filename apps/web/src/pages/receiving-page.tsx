import { useState } from 'react';
import { PackageCheck, ShieldCheck } from 'lucide-react';
import { useCreateReceivingRecord, useListPurchaseOrders } from '@workspace/api-client';
import { ActionButton } from '@/components/shared/action-button';
import { Panel } from '@/components/shared/panel';
import { PageTitle } from '@/components/shared/page-title';
import { ORG_SLUG } from '@/lib/constants';

export default function Receiving() {
  const po = useListPurchaseOrders(ORG_SLUG, {}); const create = useCreateReceivingRecord(); const [selected, setSelected] = useState(''); const [quantity, setQuantity] = useState(''); const [notes, setNotes] = useState('');
  const record = () => create.mutate({ orgSlug: ORG_SLUG, data: { purchaseOrderId: selected, quantity: Number(quantity), conditionNotes: notes } }, { onSuccess: () => { setSelected(''); setQuantity(''); setNotes(''); } });
  return <><PageTitle title="Receiving" description="Record what arrived so accounts payable can trust the match." /><div className="receiving-layout"><Panel className="receiving-form"><p className="eyebrow">Record receipt</p><h2>What made it to the dock?</h2><label>Purchase order<select value={selected} onChange={(e) => setSelected(e.target.value)} data-testid="select-receiving-po"><option value="">Choose an open PO</option>{po.data?.map((p) => <option value={p.id} key={p.id}>{p.number} · {p.vendorName}</option>)}</select></label><label>Quantity received<input type="number" min="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} data-testid="input-receiving-quantity" /></label><label>Condition notes<textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything finance should know?" data-testid="textarea-receiving-notes" /></label><ActionButton className="button-primary" onClick={record} disabled={!selected || !quantity || create.isPending} data-testid="button-record-receiving"><PackageCheck size={15} /> Record receipt</ActionButton></Panel><Panel><p className="eyebrow">Control note</p><h2>Receiving closes the loop.</h2><p className="body-copy">A receiving record is evidence — not a status toggle. Add condition notes when quantity, quality, or delivery differs from the purchase order.</p><div className="soft-callout"><ShieldCheck size={17} /><span>Receipts are immediately available to three-way matching.</span></div></Panel></div></>;
}
