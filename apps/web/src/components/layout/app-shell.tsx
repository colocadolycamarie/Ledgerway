import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Bell, ChevronDown, LogOut, Menu, Search, Settings, User, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useClerk, useUser } from '@clerk/react';
import { useGetDashboard, useHealthCheck, useListApprovalQueue } from '@workspace/api-client';
import { Logo } from '@/components/layout/logo';
import { GlobalSearch } from '@/components/layout/global-search';
import { NotificationsPanel } from '@/components/layout/notifications-panel';
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

function AccountMenu({ userName, userSubtitle, compact = false }: { userName: string; userSubtitle: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const { openUserProfile, signOut } = useClerk();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div className={`account-menu ${compact ? 'account-menu-compact' : ''}`} ref={menuRef}>
      <button
        className={compact ? 'top-avatar' : 'user-chip'}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${userName}`}
        data-testid="button-user-menu"
      >
        {compact ? (
          initialsFor(userName)
        ) : (
          <>
            <span className="avatar">{initialsFor(userName)}</span>
            <span>
              <strong>{userName}</strong>
              <small>{userSubtitle}</small>
            </span>
            <ChevronDown size={13} />
          </>
        )}
      </button>
      {open && (
        <div className="account-menu-dropdown" role="menu">
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              openUserProfile();
            }}
            data-testid="button-account-settings"
          >
            <User size={15} /> Account settings
          </button>
          <Link
            href="/app/ledgerway/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            data-testid="link-workspace-settings"
          >
            <Settings size={15} /> Workspace settings
          </Link>
          <button
            role="menuitem"
            className="account-menu-signout"
            onClick={() => signOut({ redirectUrl: '/' })}
            data-testid="button-sign-out"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobile, setMobile] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [location] = useLocation();
  const health = useHealthCheck();
  const approval = useListApprovalQueue(ORG_SLUG);
  // Cached alongside the dashboard page's own request — React Query dedupes
  // identical keys, so this doesn't add an extra network round trip on most
  // navigations within the app.
  const dashboard = useGetDashboard(ORG_SLUG);
  const { user } = useUser();

  const organizationName = dashboard.data?.organization ?? 'Loading workspace…';
  const workspaceMark = organizationName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('') || '··';
  const userName = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Signed in' : 'Loading…';
  const userSubtitle = user?.primaryEmailAddress?.emailAddress ?? '';
  const pendingCount = approval.data?.length ?? 0;

  const current = [...primaryNavItems, ...controlPlaneNavItems].find((item) => item.href !== '/app/ledgerway/' && location.startsWith(item.href)) || primaryNavItems[0];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top">
          <Logo dark />
          <button className="sidebar-close" onClick={() => setMobile(false)} aria-label="Close menu" data-testid="button-close-sidebar">
            <X size={18} />
          </button>
        </div>
        <Link href="/app/ledgerway/settings" className="workspace-switcher" data-testid="link-workspace-switcher">
          <span className="workspace-mark">{workspaceMark}</span>
          <span>
            <strong>{organizationName}</strong>
            <small>Operating workspace</small>
          </span>
          <ChevronDown size={14} />
        </Link>
        <nav className="sidebar-nav">
          <p className="nav-label">Workspace</p>
          {primaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobile(false)}
              className={`nav-link ${current.href === item.href ? 'active' : ''}`}
              data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
              {item.count && pendingCount > 0 && <b>{pendingCount}</b>}
            </Link>
          ))}
          <p className="nav-label nav-label-spaced">Control plane</p>
          {controlPlaneNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobile(false)}
              className={`nav-link ${current.href === item.href ? 'active' : ''}`}
              data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className={`health-dot ${health.isError ? 'down' : ''}`}>
            <i />
            {health.isLoading ? 'Checking control plane' : health.isError ? 'Control plane unavailable' : 'Control plane operational'}
          </div>
          <AccountMenu userName={userName} userSubtitle={userSubtitle} />
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobile(true)} aria-label="Open menu" data-testid="button-open-sidebar">
            <Menu size={21} />
          </button>
          <div className="crumb">
            <span>{organizationName}</span>
            <span>/</span>
            <strong>{current.label}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="icon-button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search (⌘K)"
              title="Search (⌘K)"
              data-testid="button-search"
            >
              <Search size={18} />
            </button>
            <div className="notifications-anchor">
              <button
                className="icon-button notification"
                onClick={() => setNotificationsOpen((v) => !v)}
                aria-label={pendingCount > 0 ? `Notifications (${pendingCount} pending)` : 'Notifications'}
                aria-expanded={notificationsOpen}
                data-testid="button-notifications"
              >
                <Bell size={18} />
                {pendingCount > 0 && <i />}
              </button>
              {notificationsOpen && <NotificationsPanel onClose={() => setNotificationsOpen(false)} />}
            </div>
            <AccountMenu userName={userName} userSubtitle={userSubtitle} compact />
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
