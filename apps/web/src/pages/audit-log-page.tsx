import { ArrowRight, BookOpen } from 'lucide-react';
import { useListAuditLog } from '@workspace/api-client';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ActionButton } from '@/components/shared/action-button';
import { Panel } from '@/components/shared/panel';
import { PageTitle } from '@/components/shared/page-title';
import { ORG_SLUG } from '@/lib/constants';
import { formatDate } from '@/lib/format';

export default function AuditLog() {
  const query = useListAuditLog(ORG_SLUG); return <><PageTitle eyebrow="Immutable evidence" title="Audit log" description="Every consequential action, with actor, target, and timestamp." action={<ActionButton className="button-secondary" disabled title="Log export is coming soon" aria-label="Export log (coming soon)" data-testid="button-export-audit"><ArrowRight size={15} /> Export log</ActionButton>} /><Panel>{query.isLoading ? <LoadingSkeleton rows={7} /> : query.isError ? <ErrorState retry={() => query.refetch()} /> : query.data?.length ? <div className="audit-list">{query.data.map((event) => <div className="audit-row" key={event.id} data-testid={`row-audit-${event.id}`}><span className="audit-time font-mono">{formatDate(event.createdAt)}</span><span className="audit-dot" /><div><strong>{event.action}</strong><p>{event.actor} acted on <b>{event.target}</b></p></div><span className="audit-meta">{event.metadata || 'Recorded event'}</span></div>)}</div> : <EmptyState icon={BookOpen} title="The record is quiet" text="System activity will appear here as your team moves spend through the chain." />}</Panel></>;
}
