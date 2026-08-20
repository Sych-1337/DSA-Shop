import type { Prisma } from "@/generated/prisma";
import { getCustomerToken } from "@/features/account/cookie";
import { getSession } from "@/lib/auth/rbac";
import type { TrackPayload } from "@/features/analytics/events";
import { getCartToken } from "@/features/cart/cookie";
import { getAnalyticsProviderName, isFirebaseAnalyticsConfigured } from "@/lib/firebase/config";
import { getAnalyticsProvider } from "@/lib/providers";
import { prisma } from "@/lib/db/prisma";

async function softShopperKey() {
  const session = await getSession();
  if (session?.user?.id) return `user:${session.user.id}`;
  const [customerToken, cartToken] = await Promise.all([getCustomerToken(), getCartToken()]);
  if (customerToken) return `guest:${customerToken}`;
  if (cartToken) return `cart:${cartToken}`;
  return null;
}

export async function trackEvent(input: TrackPayload) {
  const shopperKey = await softShopperKey();
  const properties = {
    ...(input.properties ?? {}),
    ...(shopperKey ? { shopper_key: shopperKey } : {}),
  } as Prisma.InputJsonValue;

  if (!input.ephemeral) {
    await prisma.analyticsEvent.create({
      data: {
        name: input.name,
        properties,
        path: input.path,
        sessionId: input.sessionId ?? shopperKey ?? undefined,
      },
    });

    const day = new Date();
    day.setUTCHours(0, 0, 0, 0);
    await prisma.dailyMetric.upsert({
      where: { date_key: { date: day, key: input.name } },
      create: { date: day, key: input.name, value: 1 },
      update: { value: { increment: 1 } },
    });
  }

  await getAnalyticsProvider().track({
    name: input.name,
    properties: input.properties,
    path: input.path,
    sessionId: input.sessionId ?? shopperKey ?? undefined,
    clientId: shopperKey ?? undefined,
  });
}

export async function getAnalyticsOverview(days = 14) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [eventCounts, recent, metrics] = await Promise.all([
    prisma.analyticsEvent.groupBy({
      by: ["name"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { name: "desc" } },
    }),
    prisma.analyticsEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.dailyMetric.findMany({
      where: { date: { gte: since } },
      orderBy: [{ date: "asc" }, { key: "asc" }],
    }),
  ]);

  return {
    eventCounts,
    recent,
    metrics,
    since,
    provider: getAnalyticsProviderName(),
    firebaseConfigured: isFirebaseAnalyticsConfigured(),
  };
}
