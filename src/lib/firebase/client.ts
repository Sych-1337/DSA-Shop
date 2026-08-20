"use client";

import { getFirebaseWebConfig } from "@/lib/firebase/config";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let gtagReady: Promise<void> | null = null;

/** Load gtag.js once — powers Firebase Analytics / GA4 in the browser. */
export function ensureGtag(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const config = getFirebaseWebConfig();
  if (!config?.measurementId) return Promise.resolve();

  if (gtagReady) return gtagReady;

  gtagReady = new Promise((resolve) => {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", config.measurementId, {
      send_page_view: false,
      anonymize_ip: true,
    });

    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-firebase-gtag="${config.measurementId}"]`,
    );
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
      config.measurementId,
    )}`;
    script.dataset.firebaseGtag = config.measurementId;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });

  return gtagReady;
}

export async function trackClientEvent(
  name: string,
  params?: Record<string, unknown>,
) {
  const config = getFirebaseWebConfig();
  if (!config?.measurementId) return;
  await ensureGtag();
  window.gtag?.("event", name, params ?? {});
}

export async function trackClientPageView(path: string, title?: string) {
  const config = getFirebaseWebConfig();
  if (!config?.measurementId) return;
  await ensureGtag();
  window.gtag?.("event", "page_view", {
    page_path: path,
    page_title: title ?? document.title,
    page_location: window.location.href,
  });
}
