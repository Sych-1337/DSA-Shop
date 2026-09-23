import { FirebaseAnalyticsProvider } from "./analytics/firebase";
import { MockAnalyticsProvider } from "./analytics/mock";
import type { AnalyticsProvider } from "./analytics/types";
import { MockEmailProvider } from "./email/mock";
import type { EmailProvider } from "./email/mock";
import { ResendEmailProvider, SmtpEmailProvider } from "./email/smtp";
import { MockPaymentProvider } from "./payment/mock";
import type { PaymentProvider } from "./payment/types";
import { WayForPayPaymentProvider } from "./payment/wayforpay";
import { MockShippingProvider } from "./shipping/mock";
import type { ShippingProvider } from "./shipping/types";
import { LocalDiskStorageProvider } from "./storage/local-disk";
import { MockStorageProvider } from "./storage/mock";
import type { StorageProvider } from "./storage/mock";
import { SupabaseStorageProvider } from "./storage/supabase";
import { getAnalyticsProviderName } from "@/lib/firebase/config";

export function getPaymentProvider(): PaymentProvider {
  const driver = (process.env.PAYMENT_PROVIDER ?? "mock").toLowerCase();
  if (driver === "wayforpay") {
    return new WayForPayPaymentProvider();
  }
  return new MockPaymentProvider();
}

export function getShippingProvider(): ShippingProvider {
  return new MockShippingProvider();
}

export function getEmailProvider(): EmailProvider {
  const driver = (process.env.EMAIL_PROVIDER ?? "mock").toLowerCase();
  if (driver === "resend") return new ResendEmailProvider();
  if (driver === "smtp") return new SmtpEmailProvider();
  return new MockEmailProvider();
}

export function getStorageProvider(): StorageProvider {
  const driver = (process.env.STORAGE_PROVIDER ?? "local").toLowerCase();
  if (driver === "supabase") {
    return new SupabaseStorageProvider();
  }
  if (driver === "s3") {
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
