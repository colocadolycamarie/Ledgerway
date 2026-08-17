import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client';

import App from './app';
import { ErrorBoundary } from '@/components/shared/error-boundary';

import './index.css';

// Same-origin '/api' by default (frontend and API served together); set
// VITE_API_BASE_URL when the API is deployed separately (e.g. frontend on
// Vercel, API on Railway/Render/Fly).
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
if (apiBaseUrl) {
  setBaseUrl(apiBaseUrl);
}

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
