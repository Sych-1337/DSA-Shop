import { FirebaseAnalyticsProvider } from "./analytics/firebase";
import { MockAnalyticsProvider } from "./analytics/mock";
import type { AnalyticsProvider } from "./analytics/types";
import { MockEmailProvider } from "./email/mock";
import type { EmailProvider } from "./email/mock";
import { MockPaymentProvider } from "./payment/mock";
import type { PaymentProvider } from "./payment/types";
import { MockShippingProvider } from "./shipping/mock";
import type { ShippingProvider } from "./shipping/types";
import { LocalDiskStorageProvider } from "./storage/local-disk";
import { MockStorageProvider } from "./storage/mock";
import type { StorageProvider } from "./storage/mock";
import { getAnalyticsProviderName } from "@/lib/firebase/config";

export function getPaymentProvider(): PaymentProvider {
  return new MockPaymentProvider();
}

export function getShippingProvider(): ShippingProvider {
  return new MockShippingProvider();
}

export function getEmailProvider(): EmailProvider {
  return new MockEmailProvider();
}

export function getStorageProvider(): StorageProvider {
  const driver = (process.env.STORAGE_PROVIDER ?? "local").toLowerCase();
  // local / mock both write to public/uploads until S3 adapter is wired
  if (driver === "s3") {
    // Placeholder: keep disk until S3 client is added for hosting
    return new LocalDiskStorageProvider();
  }
  if (driver === "memory") {
    return new MockStorageProvider();
  }
  return new LocalDiskStorageProvider();
}

export function getAnalyticsProvider(): AnalyticsProvider {
  const driver = getAnalyticsProviderName();
  if (driver === "firebase" || driver === "ga4") {
    return new FirebaseAnalyticsProvider();
  }
  return new MockAnalyticsProvider();
}
