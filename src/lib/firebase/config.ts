/**
 * Firebase / GA4 site analytics config.
 * Web Firebase Analytics uses a GA4 measurement ID (G-XXXX).
 * Fill NEXT_PUBLIC_* from Firebase Console → Project settings → Your apps.
 */
export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
};

export function getFirebaseWebConfig(): FirebaseWebConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim();
  const measurementId =
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ||
    process.env.GA_MEASUREMENT_ID?.trim();

  if (!measurementId) return null;

  // Minimal mode: only measurement ID (gtag) — enough for Firebase Analytics events.
  if (!apiKey || !projectId || !appId) {
    return {
      apiKey: apiKey ?? "",
      authDomain: authDomain ?? "",
      projectId: projectId ?? "",
      storageBucket: storageBucket ?? "",
      messagingSenderId: messagingSenderId ?? "",
      appId: appId ?? "",
      measurementId,
    };
  }

  return {
    apiKey,
    authDomain: authDomain ?? `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: storageBucket ?? `${projectId}.appspot.com`,
    messagingSenderId: messagingSenderId ?? "",
    appId,
    measurementId,
  };
}

export function isFirebaseAnalyticsConfigured() {
  return Boolean(getFirebaseWebConfig()?.measurementId);
}

export function getAnalyticsProviderName() {
  return (process.env.ANALYTICS_PROVIDER ?? "mock").toLowerCase();
}

/** Server-side Measurement Protocol (optional, for purchase etc.). */
export function getGa4MeasurementProtocolConfig() {
  const measurementId =
    process.env.FIREBASE_MEASUREMENT_ID?.trim() ||
    process.env.GA_MEASUREMENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const apiSecret = process.env.GA4_API_SECRET?.trim();
  if (!measurementId || !apiSecret) return null;
  return { measurementId, apiSecret };
}
