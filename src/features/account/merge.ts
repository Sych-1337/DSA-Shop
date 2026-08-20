import { getCustomerToken } from "@/features/account/cookie";
import { getSession } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";

/**
 * After storefront email sign-in / sign-up: attach guest profile, wishlists, interests to user.
 */
export async function mergeGuestCustomerAfterAuth() {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return { merged: false as const };

  const token = await getCustomerToken();
  const guestKey = token ? `guest:${token}` : null;
  const userKey = `user:${userId}`;

  let userProfile = await prisma.customerProfile.findUnique({ where: { userId } });
  const guestProfile =
    token != null
      ? await prisma.customerProfile.findUnique({ where: { anonymousToken: token } })
      : null;

  if (!userProfile && guestProfile) {
    userProfile = await prisma.customerProfile.update({
      where: { id: guestProfile.id },
      data: {
        userId,
        anonymousToken: null,
        contactEmail: guestProfile.contactEmail ?? session.user.email?.toLowerCase() ?? null,
      },
    });
  } else if (!userProfile) {
    userProfile = await prisma.customerProfile.create({
      data: {
        userId,
        contactEmail: session.user.email?.toLowerCase() ?? null,
        firstName: session.user.name?.split(" ")[0] || null,
      },
    });
  } else if (guestProfile && guestProfile.id !== userProfile.id) {
    await prisma.customerProfile.update({
      where: { id: userProfile.id },
      data: {
        firstName: userProfile.firstName ?? guestProfile.firstName,
        lastName: userProfile.lastName ?? guestProfile.lastName,
        phone: userProfile.phone ?? guestProfile.phone,
        city: userProfile.city ?? guestProfile.city,
        telegramUsername: userProfile.telegramUsername ?? guestProfile.telegramUsername,
        birthDate: userProfile.birthDate ?? guestProfile.birthDate,
        note: userProfile.note ?? guestProfile.note,
        contactEmail:
          userProfile.contactEmail ??
          guestProfile.contactEmail ??
          session.user.email?.toLowerCase() ??
          null,
      },
    });

    // Move guest addresses onto the signed-in profile when empty names collide less
    await prisma.customerAddress.updateMany({
      where: { customerProfileId: guestProfile.id },
      data: { customerProfileId: userProfile.id },
    });

    await prisma.customerProfile.delete({ where: { id: guestProfile.id } }).catch(() => undefined);
  }

  if (token) {
    await prisma.wishlistList.updateMany({
      where: { anonymousToken: token },
      data: { userId, anonymousToken: null },
    });
  }

  if (guestKey) {
    const guestInterests = await prisma.productInterest.findMany({
      where: { shopperKey: guestKey },
    });
    for (const row of guestInterests) {
      await prisma.productInterest.upsert({
        where: {
          shopperKey_productId_signal: {
            shopperKey: userKey,
            productId: row.productId,
            signal: row.signal,
          },
        },
        create: {
          shopperKey: userKey,
          productId: row.productId,
          signal: row.signal,
          weight: row.weight,
        },
        update: { weight: { increment: row.weight } },
      });
    }
    await prisma.productInterest.deleteMany({ where: { shopperKey: guestKey } });
  }

  return { merged: true as const, userId };
}
