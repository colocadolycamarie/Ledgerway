import { ArrowRight, Plus, SlidersHorizontal } from 'lucide-react';
import { useListApprovalPolicies } from '@workspace/api-client';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ActionButton } from '@/components/shared/action-button';
import { Panel } from '@/components/shared/panel';
import { PageTitle } from '@/components/shared/page-title';
import { ORG_SLUG } from '@/lib/constants';

export default function ApprovalPolicies() {
  const query = useListApprovalPolicies(ORG_SLUG);
  return (
    <>
      <PageTitle
        title="Approval policies"
        description="The rules that decide who sees a request, and when."
        action={
          <ActionButton
            className="button-primary"
            disabled
            title="Policy editing is coming soon"
            aria-label="New policy (coming soon)"
            data-testid="button-new-policy"
          >
            <Plus size={16} /> New policy
          </ActionButton>
        }
      />
      <Panel>
        {query.isLoading ? (
          <LoadingSkeleton />
        ) : query.isError ? (
          <ErrorState retry={() => query.refetch()} />
        ) : query.data?.length ? (
          <div className="policy-list">
            {query.data.map((p) => (
              <div className="policy-row" key={p.id} data-testid={`row-policy-${p.id}`}>
                <div className="policy-icon">
                  <SlidersHorizontal size={17} />
                </div>
                <div>
                  <strong>{p.name}</strong>
                  <small>
                    Version {p.version} · {p.rules.length} rule{p.rules.length === 1 ? '' : 's'}
                  </small>
                </div>
                <StatusBadge value={p.isActive ? 'active' : 'inactive'} />
                <ActionButton
                  className="button-small button-secondary"
                  disabled
                  title="Policy editing is coming soon"
                  aria-label={`Review rules for ${p.name} (coming soon)`}
                  data-testid={`button-edit-policy-${p.id}`}
                >
                  Review rules <ArrowRight size={13} />
                </ActionButton>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={SlidersHorizontal}
            title="No approval policies"
            text="Create a policy to route spend decisions with confidence."
            action={
              <ActionButton
                className="button-primary"
                disabled
                title="Policy editing is coming soon"
                aria-label="Create policy (coming soon)"
                data-testid="button-create-first-policy"
              >
                <Plus size={15} /> Create policy
              </ActionButton>
            }
          />
        )}
      </Panel>
    </>
  );
}
