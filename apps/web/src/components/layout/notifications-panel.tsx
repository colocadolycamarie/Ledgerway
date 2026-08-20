import { useEffect, useRef } from 'react';
import { ClipboardCheck, X } from 'lucide-react';
import { Link } from 'wouter';
import { useListApprovalQueue, useListAuditLog } from '@workspace/api-client';
import { ORG_SLUG } from '@/lib/constants';
import { formatDate } from '@/lib/format';

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const approvals = useListApprovalQueue(ORG_SLUG);
  const activity = useListAuditLog(ORG_SLUG);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [onClose]);

  const pending = approvals.data ?? [];
  const recent = (activity.data ?? []).slice(0, 6);

  return (
    <div className="notifications-panel" ref={panelRef} role="dialog" aria-label="Notifications" data-testid="panel-notifications">
      <div className="notifications-header">
        <strong>Notifications</strong>
        <button className="icon-button" onClick={onClose} aria-label="Close notifications" data-testid="button-close-notifications">
          <X size={15} />
        </button>
      </div>
      <div className="notifications-body">
        {pending.length > 0 && (
          <div className="notifications-group">
            <p className="notifications-group-label">Waiting on your decision ({pending.length})</p>
            {pending.slice(0, 4).map((item) => (
              <Link
                key={item.id}
                href={`/app/ledgerway/requisitions/${item.requisitionId}`}
                className="notifications-row"
                onClick={onClose}
                data-testid={`notification-approval-${item.id}`}
              >
                <ClipboardCheck size={14} />
                <span>
                  <strong>{item.requisitionNumber}</strong>
                  <small>{item.description} · {item.requester}</small>
                </span>
              </Link>
            ))}
            {pending.length > 4 && (
              <Link href="/app/ledgerway/approvals" className="text-link notifications-view-all" onClick={onClose}>
                View all {pending.length}
              </Link>
            )}
          </div>
        )}
        <div className="notifications-group">
          <p className="notifications-group-label">Recent activity</p>
          {recent.length === 0 ? (
            <p className="notifications-empty">Nothing yet.</p>
          ) : (
            recent.map((event) => (
              <div className="notifications-row notifications-row-static" key={event.id} data-testid={`notification-activity-${event.id}`}>
                <span>
                  <strong>{event.action}</strong>
                  <small>{event.actor} · {event.target}</small>
                </span>
                <small>{formatDate(event.createdAt.toString())}</small>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
