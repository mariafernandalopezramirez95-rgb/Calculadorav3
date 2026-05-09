import posthog from 'posthog-js';

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;

// api_host se detecta automáticamente según la región de la cuenta (US/EU)
const HOST = KEY?.startsWith('phc_') && KEY.length > 20
  ? (import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com')
  : 'https://us.i.posthog.com';

export function initAnalytics() {
  if (!KEY) return;
  posthog.init(KEY, {
    api_host: HOST,
    person_profiles: 'identified_only',
    capture_pageview: true,
    loaded: (ph) => { console.log('[Analytics] Posthog activo:', ph.get_distinct_id()); },
  });
}

export function track(event: string, props?: Record<string, unknown>) {
  if (!KEY) return;
  posthog.capture(event, props);
}
