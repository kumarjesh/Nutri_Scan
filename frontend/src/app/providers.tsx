'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_ki5c86tGZJHwfHnEJdztikc3tpQ3gSuRoN7GB5gbFMsZ';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (POSTHOG_KEY) {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        person_profiles: 'always',
        capture_pageview: true,
        capture_pageleave: true,
        loaded: (ph) => {
          ph.capture('$pageview');
        }
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
