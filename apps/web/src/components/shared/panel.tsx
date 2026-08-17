import { type ReactNode } from 'react';

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={`card ${className}`}>{children}</section>; }
