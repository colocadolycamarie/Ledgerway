import { type ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import { ActionButton } from '@/components/shared/action-button';

export function InlineForm({ title, onClose, onSubmit, children }: { title: string; onClose: () => void; onSubmit: () => void; children: ReactNode }) { return <div className="inline-form card animate-enter"><div className="card-heading"><div><p className="eyebrow">New record</p><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close form" data-testid="button-close-form"><X size={17} /></button></div><div className="inline-form-fields">{children}</div><div className="form-actions"><ActionButton className="button-secondary" onClick={onClose} data-testid="button-cancel-form">Cancel</ActionButton><span /><ActionButton className="button-primary" onClick={onSubmit} data-testid="button-save-form">Save record <Check size={14} /></ActionButton></div></div>; }
