import type { AnalyticsProvider, AnalyticsTrackInput } from "./types";

export type { AnalyticsProvider, AnalyticsTrackInput };

export class MockAnalyticsProvider implements AnalyticsProvider {
  readonly name = "mock";

  async track(event: AnalyticsTrackInput) {
    if (process.env.NODE_ENV === "development") {
      console.info("[MockAnalytics]", event.name, {
        path: event.path,
        sessionId: event.sessionId,
        ...event.properties,
      });
    }
  }
}
