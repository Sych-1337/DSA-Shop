"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { AnalyticsEvents } from "@/features/analytics/events";
import { ensureGtag, trackClientPageView } from "@/lib/firebase/client";
import { isFirebaseAnalyticsConfigured } from "@/lib/firebase/config";

/**
 * Client foundation for Firebase Analytics (gtag).
 * Mount once under the store locale layout.
 */
export function SiteAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string>("");

  useEffect(() => {
    if (!isFirebaseAnalyticsConfigured()) return;
    void ensureGtag();
  }, []);

  useEffect(() => {
    if (!isFirebaseAnalyticsConfigured()) return;
    const qs = searchParams?.toString();
    const path = qs ? `${pathname}?${qs}` : pathname;
    if (!path || path === lastPath.current) return;
    lastPath.current = path;
    void trackClientPageView(path);
  }, [pathname, searchParams]);

  return null;
}

/** Helper for buttons / cards — fires client Firebase event. */
export async function trackBrowserEvent(
  name: string,
  properties?: Record<string, unknown>,
) {
  if (!isFirebaseAnalyticsConfigured()) return;
  const { trackClientEvent } = await import("@/lib/firebase/client");
  await trackClientEvent(name || AnalyticsEvents.SELECT_ITEM, properties);
}
