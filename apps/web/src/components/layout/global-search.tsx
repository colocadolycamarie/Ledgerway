import { useEffect, useRef, useState } from 'react';
import { FileText, Loader2, Receipt, Search, ShoppingCart, X, Building2 } from 'lucide-react';
import { Link } from 'wouter';
import { useListInvoices, useListPurchaseOrders, useListRequisitions, useListVendors } from '@workspace/api-client';
import { ORG_SLUG } from '@/lib/constants';
import { formatCurrency } from '@/lib/format';

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function GlobalSearch({ onClose }: { onClose: () => void }) {
  const [term, setTerm] = useState('');
  const debounced = useDebouncedValue(term.trim(), 250);
  const enabled = debounced.length >= 2;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const requisitions = useListRequisitions(ORG_SLUG, { search: debounced }, { query: { enabled, queryKey: ['search', 'requisitions', debounced] } });
  const purchaseOrders = useListPurchaseOrders(ORG_SLUG, { search: debounced }, { query: { enabled, queryKey: ['search', 'purchase-orders', debounced] } });
  const vendors = useListVendors(ORG_SLUG, { search: debounced }, { query: { enabled, queryKey: ['search', 'vendors', debounced] } });
  const invoices = useListInvoices(ORG_SLUG, { search: debounced }, { query: { enabled, queryKey: ['search', 'invoices', debounced] } });

  const isLoading = enabled && (requisitions.isLoading || purchaseOrders.isLoading || vendors.isLoading || invoices.isLoading);
  const groups = [
    { label: 'Requisitions', icon: FileText, items: (requisitions.data ?? []).slice(0, 5).map((r) => ({ id: r.id, title: r.number, subtitle: r.description, href: `/app/ledgerway/requisitions/${r.id}`, amountCents: r.estimatedAmountCents })) },
    { label: 'Purchase orders', icon: ShoppingCart, items: (purchaseOrders.data ?? []).slice(0, 5).map((p) => ({ id: p.id, title: p.number, subtitle: p.vendorName, href: '/app/ledgerway/purchase-orders', amountCents: p.totalAmountCents })) },
    { label: 'Vendors', icon: Building2, items: (vendors.data ?? []).slice(0, 5).map((v) => ({ id: v.id, title: v.name, subtitle: v.paymentTerms, href: '/app/ledgerway/vendors', amountCents: undefined as number | undefined })) },
    { label: 'Invoices', icon: Receipt, items: (invoices.data ?? []).slice(0, 5).map((i) => ({ id: i.id, title: i.invoiceNumber, subtitle: i.vendorName, href: '/app/ledgerway/invoices', amountCents: i.totalAmountCents })) },
  ].filter((group) => group.items.length > 0);

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Search Ledgerway" data-testid="panel-global-search">
        <div className="search-input-row">
          <Search size={18} />
          <input
            ref={inputRef}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search requisitions, purchase orders, vendors, invoices…"
            aria-label="Search"
            data-testid="input-global-search"
          />
          {isLoading && <Loader2 size={16} className="spin" />}
          <button className="icon-button" onClick={onClose} aria-label="Close search" data-testid="button-close-search">
            <X size={16} />
          </button>
        </div>
        <div className="search-results">
          {!enabled ? (
            <p className="search-hint">Type at least 2 characters to search.</p>
          ) : !isLoading && groups.length === 0 ? (
            <p className="search-hint">No matches for "{debounced}".</p>
          ) : (
            groups.map((group) => (
              <div className="search-group" key={group.label}>
                <p className="search-group-label">{group.label}</p>
                {group.items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="search-result-row"
                    onClick={onClose}
                    data-testid={`search-result-${item.id}`}
                  >
                    <group.icon size={15} />
                    <span>
                      <strong>{item.title}</strong>
                      {item.subtitle ? <small>{item.subtitle}</small> : null}
                    </span>
                    {item.amountCents != null ? <b>{formatCurrency(item.amountCents)}</b> : null}
                  </Link>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
