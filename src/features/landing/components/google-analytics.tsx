"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { GA_MEASUREMENT_ID } from "@/features/landing/analytics";

function pagePath(pathname: string, search: string) {
  return search ? `${pathname}?${search}` : pathname;
}

function GoogleAnalyticsRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || typeof window.gtag !== "function") return;

    // Initial page_view comes from gtag('config', …).
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    window.gtag("event", "page_view", {
      page_path: pagePath(pathname, searchParams.toString()),
    });
  }, [pathname, searchParams]);

  return null;
}

/** Loads gtag.js on marketing pages and tracks App Router navigations. */
export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
      <Suspense fallback={null}>
        <GoogleAnalyticsRouteTracker />
      </Suspense>
    </>
  );
}
