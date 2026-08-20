import {
  getGa4MeasurementProtocolConfig,
  isFirebaseAnalyticsConfigured,
} from "@/lib/firebase/config";
import type { AnalyticsProvider, AnalyticsTrackInput } from "./types";

/**
 * Server-side Firebase Analytics (GA4 Measurement Protocol) foundation.
 * Client SDK / gtag handles browser pageviews; this covers server ecommerce events
 * when GA4_API_SECRET is set. Without secret — structured stub log only.
 */
export class FirebaseAnalyticsProvider implements AnalyticsProvider {
  readonly name = "firebase";

  async track(event: AnalyticsTrackInput) {
    const mp = getGa4MeasurementProtocolConfig();

    if (!mp) {
      if (process.env.NODE_ENV === "development") {
        console.info("[FirebaseAnalytics:stub]", event.name, {
          configured: isFirebaseAnalyticsConfigured(),
          hasMeasurementProtocol: false,
          path: event.path,
          properties: event.properties,
        });
      }
      return;
    }

    const clientId = event.clientId || event.sessionId || "server.1";
    const body = {
      client_id: clientId,
      user_id: event.userId,
      events: [
        {
          name: event.name.slice(0, 40),
          params: {
            ...(event.properties ?? {}),
            page_location: event.path
              ? `${process.env.APP_URL ?? ""}${event.path}`
              : undefined,
            engagement_time_msec: 1,
          },
        },
      ],
    };

    try {
      const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(
        mp.measurementId,
      )}&api_secret=${encodeURIComponent(mp.apiSecret)}`;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        // don't block request lifetime hard
        cache: "no-store",
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[FirebaseAnalytics] MP send failed", error);
      }
    }
  }
}
