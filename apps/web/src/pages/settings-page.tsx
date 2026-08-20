import { useEffect, useState } from 'react';
import { ArrowRight, Building2, Check, SlidersHorizontal, Users } from 'lucide-react';
import { Link } from 'wouter';
import { getGetDashboardQueryKey, getGetOrganizationQueryKey, useGetOrganization, useUpdateOrganization } from '@workspace/api-client';
import { ActionButton } from '@/components/shared/action-button';
import { PageTitle } from '@/components/shared/page-title';
import { queryClient } from '@/lib/query-client';
import { ORG_SLUG } from '@/lib/constants';

function CompanyProfileCard() {
  const org = useGetOrganization(ORG_SLUG);
  const rename = useUpdateOrganization();
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (org.data?.name) setName(org.data.name);
  }, [org.data?.name]);

  const dirty = org.data ? name.trim() !== org.data.name && name.trim().length > 0 : false;

  function save() {
    if (!dirty) return;
    rename.mutate(
      { orgSlug: ORG_SLUG, data: { name: name.trim() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetOrganizationQueryKey(ORG_SLUG) });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey(ORG_SLUG) });
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        },
      },
    );
  }

  return (
    <div className="settings-card settings-card-wide">
      <span>
        <Building2 size={19} />
      </span>
      <strong>Company profile</strong>
      <p>The name shown across Ledgerway — sidebar, dashboard, and every document your team generates.</p>
      <div className="company-name-editor">
        <label>
          Company name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
            }}
            disabled={org.isLoading}
            placeholder="Your Company"
            data-testid="input-company-name"
          />
        </label>
        <ActionButton
          className="button-small button-primary"
          onClick={save}
          disabled={!dirty || rename.isPending}
          data-testid="button-save-company-name"
        >
          {rename.isPending ? 'Saving…' : saved ? 'Saved' : 'Save'} <Check size={13} />
        </ActionButton>
      </div>
      {rename.isError && <p className="form-error">Couldn't save that name. Try again.</p>}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <>
      <PageTitle title="Settings" description="Shape how Ledgerway fits your operating rhythm." />
      <div className="settings-grid">
        <CompanyProfileCard />
        <Link href="/app/ledgerway/settings/approval-policies" className="settings-card" data-testid="link-settings-policies">
          <span>
            <SlidersHorizontal size={19} />
          </span>
          <strong>Approval policies</strong>
          <p>Route decisions by amount, cost center, and category.</p>
          <ArrowRight size={15} />
        </Link>
        <div className="settings-card disabled">
          <span>
            <Building2 size={19} />
          </span>
          <strong>Accounting connection</strong>
          <p>Connect a system of record to post commitments and payments.</p>
          <ActionButton
            className="button-small button-secondary"
            disabled
            title="Accounting integrations are coming soon"
            aria-label="Connect accounting system (coming soon)"
            data-testid="button-settings-connect"
          >
            Connect system
          </ActionButton>
        </div>
        <div className="settings-card disabled">
          <span>
            <Users size={19} />
          </span>
          <strong>People & roles</strong>
          <p>Manage requesters, approvers, and finance operators.</p>
          <ActionButton
            className="button-small button-secondary"
            disabled
            title="Role management is coming soon"
            aria-label="Review access (coming soon)"
            data-testid="button-settings-people"
          >
            Review access
          </ActionButton>
        </div>
      </div>
    </>
  );
}
