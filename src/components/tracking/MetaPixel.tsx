'use client';

/**
 * Meta Pixel — client-side tracking.
 *
 * - Loads only if NEXT_PUBLIC_META_PIXEL_ID is set.
 * - Respects eaf_analytics_consent cookie (RGPD / GDPR).
 * - Fires PageView on every route change via usePathname.
 * - When consent is not granted the pixel is initialised in
 *   "revoked" mode so Meta's LDU is correctly applied.
 */

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq: ((...args: any[]) => void) & { callMethod?: (...args: any[]) => void; queue: any[]; loaded: boolean; version: string; push: (...args: any[]) => void };
    _fbq: unknown;
  }
}

function hasAnalyticsConsent(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes('eaf_analytics_consent=true');
}

/** Call this from any client component to fire a standard Meta event. */
export function trackMetaEvent(
  event: string,
  params?: Record<string, unknown>,
  eventId?: string,
): void {
  if (typeof window === 'undefined') return;
  if (!hasAnalyticsConsent()) return;
  if (typeof window.fbq !== 'function') return;
  if (eventId) {
    window.fbq('track', event, params ?? {}, { eventID: eventId });
  } else {
    window.fbq('track', event, params ?? {});
  }
}

export function MetaPixel() {
  const pathname = usePathname();

  // Fire PageView on each client-side navigation
  useEffect(() => {
    if (!PIXEL_ID) return;
    if (!hasAnalyticsConsent()) return;
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
  }, [pathname]);

  if (!PIXEL_ID) return null;

  const initScript = `
    !function(f,b,e,v,n,t,s){
      if(f.fbq)return;n=f.fbq=function(){
        n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)
      };
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)
    }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');

    (function(){
      var consent = document.cookie.indexOf('eaf_analytics_consent=true') !== -1;
      if (consent) {
        fbq('consent', 'grant');
      } else {
        fbq('consent', 'revoke');
      }
      fbq('init', '${PIXEL_ID}');
      if (consent) { fbq('track', 'PageView'); }
    })();
  `;

  return (
    <Script
      id="meta-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: initScript }}
    />
  );
}
