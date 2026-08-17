import { useState } from 'react';
import type { ReactNode } from 'react';
import { Bell, ChevronDown, Menu, Search, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useClerk, useUser } from '@clerk/react';
import { useGetDashboard, useHealthCheck, useListApprovalQueue } from '@workspace/api-client';
import { Logo } from '@/components/layout/logo';
import { primaryNavItems, controlPlaneNavItems } from '@/components/layout/nav-config';
import { ORG_SLUG } from '@/lib/constants';

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  return parts
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobile, setMobile] = useState(false);
  const [location] = useLocation();
  const health = useHealthCheck();
  const approval = useListApprovalQueue(ORG_SLUG);
  // Cached alongside the dashboard page's own request — React Query dedupes
  // identical keys, so this doesn't add an extra network round trip on most
  // navigations within the app.
  const dashboard = useGetDashboard(ORG_SLUG);
  const { user } = useUser();
  const { openUserProfile } = useClerk();

  const organizationName = dashboard.data?.organization ?? 'Loading workspace…';
  const workspaceMark = organizationName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('') || '··';
  const userName = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Signed in' : 'Loading…';
  const userSubtitle = user?.primaryEmailAddress?.emailAddress ?? '';

  const current = [...primaryNavItems, ...controlPlaneNavItems].find((item) => item.href !== '/app/ledgerway/' && location.startsWith(item.href)) || primaryNavItems[0];
  return <div className="app-shell">
    <aside className={`sidebar ${mobile ? 'sidebar-open' : ''}`}><div className="sidebar-top"><Logo dark /><button className="sidebar-close" onClick={() => setMobile(false)} aria-label="Close menu" data-testid="button-close-sidebar"><X size={18} /></button></div>
      <div className="workspace-switcher"><span className="workspace-mark">{workspaceMark}</span><span><strong>{organizationName}</strong><small>Operating workspace</small></span><ChevronDown size={14} /></div>
      <nav className="sidebar-nav"><p className="nav-label">Workspace</p>{primaryNavItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobile(false)} className={`nav-link ${current.href === item.href ? 'active' : ''}`} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}><item.icon size={17} /><span>{item.label}</span>{item.count && approval.data && <b>{approval.data.length}</b>}</Link>)}<p className="nav-label nav-label-spaced">Control plane</p>{controlPlaneNavItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobile(false)} className={`nav-link ${current.href === item.href ? 'active' : ''}`} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}><item.icon size={17} /><span>{item.label}</span></Link>)}</nav>
      <div className="sidebar-footer"><div className={`health-dot ${health.isError ? 'down' : ''}`}><i />{health.isLoading ? 'Checking control plane' : health.isError ? 'Control plane unavailable' : 'Control plane operational'}</div><button className="user-chip" onClick={() => openUserProfile()} aria-label={`Account settings for ${userName}`} data-testid="button-user-menu"><span className="avatar">{initialsFor(userName)}</span><span><strong>{userName}</strong><small>{userSubtitle}</small></span><ChevronDown size={13} /></button></div>
    </aside>
    <div className="main-wrap"><header className="topbar"><button className="mobile-menu" onClick={() => setMobile(true)} aria-label="Open menu" data-testid="button-open-sidebar"><Menu size={21} /></button><div className="crumb"><span>{organizationName}</span><span>/</span><strong>{current.label}</strong></div><div className="topbar-actions"><button className="icon-button" disabled title="Search — coming soon" aria-label="Search (coming soon)" data-testid="button-search"><Search size={18} /></button><button className="icon-button notification" disabled title="Notifications — coming soon" aria-label="Notifications (coming soon)" data-testid="button-notifications"><Bell size={18} /><i /></button><button className="top-avatar" onClick={() => openUserProfile()} aria-label={`Account settings for ${userName}`} data-testid="button-top-avatar">{initialsFor(userName)}</button></div></header><main className="content">{children}</main></div>
  </div>;
}
