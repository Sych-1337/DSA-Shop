import { ensureCustomerToken, getCustomerToken } from "@/features/account/cookie";
import type { CustomerProfileInput } from "@/features/account/schema";
import { getSession } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";

export type CustomerIdentity =
  | { kind: "user"; userId: string }
  | { kind: "guest"; anonymousToken: string };

export async function resolveCustomerIdentity(createGuest = false): Promise<CustomerIdentity | null> {
  const session = await getSession();
  if (session?.user?.id) {
    return { kind: "user", userId: session.user.id };
  }
  if (createGuest) {
    return { kind: "guest", anonymousToken: await ensureCustomerToken() };
  }
  const token = await getCustomerToken();
  if (!token) return null;
  return { kind: "guest", anonymousToken: token };
}

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeTelegram(value: string | undefined) {
  const raw = emptyToNull(value);
  if (!raw) return null;
  return raw.startsWith("@") ? raw.slice(1) : raw;
}

export async function getCustomerAccount() {
  const identity = await resolveCustomerIdentity(false);
  if (!identity) {
    return {
      identity: null,
      sessionUser: null as null | { id: string; name: string; email: string; image: string | null },
      profile: null,
    };
  }

  const session = await getSession();
  const sessionUser = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }
    : null;

  const profile =
    identity.kind === "user"
      ? await prisma.customerProfile.findUnique({ where: { userId: identity.userId } })
      : await prisma.customerProfile.findUnique({
          where: { anonymousToken: identity.anonymousToken },
        });

  return { identity, sessionUser, profile };
}

const customerOrderInclude = {
  items: { take: 3 },
  payments: { orderBy: { createdAt: "desc" as const }, take: 1 },
};

export async function listOrdersForCustomer() {
  const { sessionUser, profile } = await getCustomerAccount();
  const email = (sessionUser?.email ?? profile?.contactEmail)?.trim().toLowerCase();
  const phone = profile?.phone?.trim();

  if (!email && !phone) {
    return {
      orders: [] as Array<{
        id: string;
        orderNumber: string;
        createdAt: Date;
        totalAmount: number;
        paymentStatus: string;
        status: string;
        items: Array<{ productTitle: string }>;
      }>,
      contact: null as null | { email?: string; phone?: string },
    };
  }

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        ...(email ? [{ customerEmail: { equals: email, mode: "insensitive" as const } }] : []),
        ...(phone ? [{ customerPhone: phone }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: customerOrderInclude,
  });

  return {
    orders,
    contact: { email: email ?? undefined, phone: phone ?? undefined },
  };
}

export async function saveCustomerProfile(input: CustomerProfileInput) {
  const identity = await resolveCustomerIdentity(true);
  if (!identity) throw new Error("IDENTITY_REQUIRED");

  const data = {
    firstName: emptyToNull(input.firstName),
    lastName: emptyToNull(input.lastName),
    contactEmail: emptyToNull(input.email)?.toLowerCase() ?? null,
    phone: emptyToNull(input.phone),
    city: emptyToNull(input.city),
    telegramUsername: normalizeTelegram(input.telegramUsername),
    birthDate: input.birthDate ? new Date(`${input.birthDate}T00:00:00.000Z`) : null,
    note: emptyToNull(input.note),
  };

  if (identity.kind === "user") {
    const displayName = [data.firstName, data.lastName].filter(Boolean).join(" ").trim();
    await prisma.$transaction([
      prisma.user.update({
        where: { id: identity.userId },
        data: {
          ...(displayName ? { name: displayName } : {}),
        },
      }),
      prisma.customerProfile.upsert({
        where: { userId: identity.userId },
        create: { userId: identity.userId, ...data },
        update: data,
      }),
    ]);
    return;
  }

  await prisma.customerProfile.upsert({
    where: { anonymousToken: identity.anonymousToken },
    create: { anonymousToken: identity.anonymousToken, ...data },
    update: data,
  });
}
