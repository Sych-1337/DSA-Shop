export type AnalyticsTrackInput = {
  name: string;
  properties?: Record<string, unknown>;
  path?: string;
  sessionId?: string;
  clientId?: string;
  userId?: string;
};

export interface AnalyticsProvider {
  readonly name: string;
  track(event: AnalyticsTrackInput): Promise<void>;
  /** Optional: flush queued events (stub for batching). */
  flush?(): Promise<void>;
}
