import './sentry';
import * as Sentry from '@sentry/react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './assets/chillax-font.css';

createRoot(document.getElementById('root')!).render(
  <Sentry.ErrorBoundary fallback={<p style={{ padding: 32 }}>Something went wrong. The team has been notified.</p>}>
    <App />
  </Sentry.ErrorBoundary>
);

// Register service worker for image caching and offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed — non-critical, app works without it
    });
  });
}
