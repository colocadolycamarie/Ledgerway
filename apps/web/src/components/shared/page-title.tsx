import { type ReactNode } from 'react';

export function PageTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) { return <div className="page-title animate-enter"><div><p className="eyebrow">{eyebrow || 'Ledgerway control center'}</p><h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{action}</div>; }
