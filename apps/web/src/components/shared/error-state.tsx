import { AlertCircle, RefreshCw } from 'lucide-react';

export function ErrorState({ retry }: { retry?: () => void }) { return <div className="empty-state" data-testid="error-state"><span className="empty-icon danger"><AlertCircle size={20} /></span><h3>Could not load this view</h3><p>Ledgerway could not reach the control plane. Your work is safe to retry.</p>{retry && <button className="button button-secondary" onClick={retry} data-testid="button-retry"><RefreshCw size={14} /> Retry</button>}</div>; }
