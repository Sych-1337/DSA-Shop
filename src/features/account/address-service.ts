import type { CustomerAddressInput } from "@/features/account/address-schema";
import { getCustomerAccount, resolveCustomerIdentity } from "@/features/account/service";
import { ShippingMethod } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";

async function requireProfileId() {
  const identity = await resolveCustomerIdentity(true);
  if (!identity) throw new Error("IDENTITY_REQUIRED");

  if (identity.kind === "user") {
    const profile = await prisma.customerProfile.upsert({
      where: { userId: identity.userId },
      create: { userId: identity.userId },
      update: {},
    });
    return profile.id;
  }

  const profile = await prisma.customerProfile.upsert({
    where: { anonymousToken: identity.anonymousToken },
    create: { anonymousToken: identity.anonymousToken },
    update: {},
  });
  return profile.id;
}

function emptyToNull(value: string | undefined | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function listCustomerAddresses() {
  const { profile } = await getCustomerAccount();
  if (!profile) return [];

  return prisma.customerAddress.findMany({
    where: { customerProfileId: profile.id },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });
}

export async function createCustomerAddress(input: CustomerAddressInput) {
  const profileId = await requireProfileId();
  const count = await prisma.customerAddress.count({ where: { customerProfileId: profileId } });
  const makeDefault = input.isDefault || count === 0;

  return prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.customerAddress.updateMany({
        where: { customerProfileId: profileId },
        data: { isDefault: false },
      });
    }

    return tx.customerAddress.create({
      data: {
        customerProfileId: profileId,
        label: input.label.trim() || "Доставка",
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone.trim(),
        email: emptyToNull(input.email)?.toLowerCase() ?? null,
        city: input.city.trim(),
        cityRef: emptyToNull(input.cityRef),
        shippingMethod: input.shippingMethod,
        warehouseRef:
          input.shippingMethod === ShippingMethod.ADDRESS
            ? null
            : emptyToNull(input.warehouseRef),
        addressLine:
          input.shippingMethod === ShippingMethod.ADDRESS
            ? emptyToNull(input.addressLine)
            : null,
        isDefault: makeDefault,
      },
    });
  });
}

export async function deleteCustomerAddress(addressId: string) {
  const profileId = await requireProfileId();
  const address = await prisma.customerAddress.findFirst({
    where: { id: addressId, customerProfileId: profileId },
  });
  if (!address) throw new Error("NOT_FOUND");

  await prisma.$transaction(async (tx) => {
    await tx.customerAddress.delete({ where: { id: address.id } });
    if (address.isDefault) {
      const next = await tx.customerAddress.findFirst({
        where: { customerProfileId: profileId },
        orderBy: { updatedAt: "desc" },
      });
      if (next) {
        await tx.customerAddress.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
  });
}

export async function setDefaultCustomerAddress(addressId: string) {
  const profileId = await requireProfileId();
  const address = await prisma.customerAddress.findFirst({
    where: { id: addressId, customerProfileId: profileId },
  });
  if (!address) throw new Error("NOT_FOUND");

  await prisma.$transaction([
    prisma.customerAddress.updateMany({
      where: { customerProfileId: profileId },
      data: { isDefault: false },
    }),
    prisma.customerAddress.update({
      where: { id: address.id },
      data: { isDefault: true },
    }),
  ]);
}
