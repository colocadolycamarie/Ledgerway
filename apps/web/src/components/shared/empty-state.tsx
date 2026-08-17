import { type ReactNode } from 'react';
import { FileText } from 'lucide-react';

export function EmptyState({ icon: Icon = FileText, title, text, action }: { icon?: typeof FileText; title: string; text: string; action?: ReactNode }) { return <div className="empty-state" data-testid="empty-state"><span className="empty-icon"><Icon size={20} /></span><h3>{title}</h3><p>{text}</p>{action}</div>; }
