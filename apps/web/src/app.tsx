import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, useAuth, useUser } from '@clerk/react';
import { Router as WouterRouter, useLocation } from 'wouter';
import { setAuthTokenGetter } from '@workspace/api-client';
import { AppRouter } from '@/router';
import { queryClient } from '@/lib/query-client';
import { clerkAppearance } from '@/lib/clerk-appearance';
import { BASE_PATH } from '@/lib/constants';

// Use the publishable key directly. Clerk's SDK already derives the correct
// Frontend API host from the key itself (it's base64-encoded inside it) —
// no host-based resolution needed unless you've deliberately set up a Clerk
// proxy (see VITE_CLERK_PROXY_URL / apps/api/src/middleware/clerk-proxy.ts),
// which most deployments haven't.
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL || undefined;

function AuthenticatedApp() {
  const { user } = useUser();
  const { getToken } = useAuth();

  // The web app and API are on different domains (e.g. Vercel + Railway),
  // so the Clerk session cookie can't cross-site authenticate API requests.
  // Attach the session token as a Bearer header on every request instead.
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  return (
    <QueryClientProvider client={queryClient}>
      <div data-user-id={user?.id || undefined}>
        <AppRouter />
      </div>
    </QueryClientProvider>
  );
}

function ClerkShell() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${BASE_PATH}/sign-in`}
      signUpUrl={`${BASE_PATH}/sign-up`}
      routerPush={(to) => setLocation(to.replace(BASE_PATH, '') || '/')}
      routerReplace={(to) => setLocation(to.replace(BASE_PATH, '') || '/')}
    >
      <AuthenticatedApp />
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={BASE_PATH}>
      <ClerkShell />
    </WouterRouter>
  );
}
