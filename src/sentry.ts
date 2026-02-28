import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: window.location.hostname.includes('localhost') ? 'development' : 'production',
  enabled: !window.location.hostname.includes('localhost'),
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
  ],
  tracesSampleRate: 0.2,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  initialScope: {
    tags: { platform: 'university', app: 'mobile' },
  },
});
