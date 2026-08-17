import { Redirect, Route, Switch } from 'wouter';
import { RedirectToSignIn, useAuth } from '@clerk/react';
import { Landmark } from 'lucide-react';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { AppShell } from '@/components/layout/app-shell';
import NotFound from '@/pages/not-found';
import Landing from '@/pages/landing-page';
import AuthPage from '@/pages/auth-page';
import Dashboard from '@/pages/dashboard-page';
import Requisitions from '@/pages/requisitions-page';
import NewRequisition from '@/pages/new-requisition-page';
import RequisitionDetail from '@/pages/requisition-detail-page';
import Approvals from '@/pages/approvals-page';
import PurchaseOrders from '@/pages/purchase-orders-page';
import Vendors from '@/pages/vendors-page';
import Receiving from '@/pages/receiving-page';
import Invoices from '@/pages/invoices-page';
import InvoiceMatch from '@/pages/invoice-match-page';
import Payments from '@/pages/payments-page';
import Budgets from '@/pages/budgets-page';
import Analytics from '@/pages/analytics-page';
import Settings from '@/pages/settings-page';
import ApprovalPolicies from '@/pages/approval-policies-page';
import AuditLog from '@/pages/audit-log-page';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <span className="loading-mark">
        <Landmark size={18} />
      </span>
    </div>
  );
}

function AuthenticatedPortal() {
  return (
    <AppShell>
      <Switch>
        <Route path="/app/ledgerway/" component={Dashboard} />
        <Route path="/app/ledgerway/requisitions/new" component={NewRequisition} />
        <Route path="/app/ledgerway/requisitions/:id" component={RequisitionDetail} />
        <Route path="/app/ledgerway/requisitions" component={Requisitions} />
        <Route path="/app/ledgerway/approvals" component={Approvals} />
        <Route path="/app/ledgerway/purchase-orders" component={PurchaseOrders} />
        <Route path="/app/ledgerway/vendors" component={Vendors} />
        <Route path="/app/ledgerway/receiving" component={Receiving} />
        <Route path="/app/ledgerway/invoices/:id/match" component={InvoiceMatch} />
        <Route path="/app/ledgerway/invoices" component={Invoices} />
        <Route path="/app/ledgerway/payments" component={Payments} />
        <Route path="/app/ledgerway/budgets" component={Budgets} />
        <Route path="/app/ledgerway/analytics" component={Analytics} />
        <Route path="/app/ledgerway/settings/approval-policies" component={ApprovalPolicies} />
        <Route path="/app/ledgerway/settings" component={Settings} />
        <Route path="/app/ledgerway/audit-log" component={AuditLog} />
        <Route component={NotFound} />
      </Switch>
    </AppShell>
  );
}

function HomeRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <LoadingScreen />;
  return isSignedIn ? <Redirect to="/app/ledgerway/" /> : <Landing />;
}

function RequireAuth() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <LoadingScreen />;
  return isSignedIn ? <AuthenticatedPortal /> : <RedirectToSignIn />;
}

export function AppRouter() {
  return (
    <ErrorBoundary resetKey={window.location.pathname}>
      <Switch>
        <Route path="/" component={HomeRoute} />
        <Route path="/sign-in/*?" component={() => <AuthPage mode="sign-in" />} />
        <Route path="/sign-up/*?" component={() => <AuthPage mode="sign-up" />} />
        <Route path="/app/ledgerway/*" component={RequireAuth} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}
