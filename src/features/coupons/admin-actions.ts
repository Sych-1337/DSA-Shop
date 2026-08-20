"use server";

import { revalidatePath } from "next/cache";

import {
  createCoupon,
  toggleCouponActive,
  updateCoupon,
  type CouponAdminInput,
} from "@/features/coupons/service";
import { CouponType } from "@/generated/prisma";
import { assertPermission } from "@/lib/auth/rbac";

function parseCouponForm(formData: FormData): CouponAdminInput {
  const typeRaw = formData.get("type")?.toString() ?? "PERCENTAGE";
  const type = (Object.values(CouponType) as string[]).includes(typeRaw)
    ? (typeRaw as CouponType)
    : CouponType.PERCENTAGE;

  const percentRaw = formData.get("percentOff")?.toString();
  const amountRaw = formData.get("amountOffUah")?.toString();
  const minRaw = formData.get("minOrderUah")?.toString();
  const limitRaw = formData.get("usageLimit")?.toString();

  return {
    code: formData.get("code")?.toString() ?? "",
    type,
    percentOff: percentRaw ? Number(percentRaw) : null,
    amountOffUah: amountRaw ? Number(amountRaw) : null,
    minOrderUah: minRaw ? Number(minRaw) : null,
    usageLimit: limitRaw ? Number(limitRaw) : null,
    isActive: formData.get("isActive")?.toString() === "on",
    startsAt: formData.get("startsAt")?.toString() || null,
    endsAt: formData.get("endsAt")?.toString() || null,
  };
}

export async function createCouponAction(formData: FormData) {
  await assertPermission("products.write");
  try {
    await createCoupon(parseCouponForm(formData));
    revalidatePath("/admin/coupons");
  } catch {
    revalidatePath("/admin/coupons");
  }
}

export async function updateCouponAction(formData: FormData) {
  await assertPermission("products.write");
  const id = formData.get("id")?.toString();
  if (!id) return;
  try {
    await updateCoupon(id, parseCouponForm(formData));
    revalidatePath("/admin/coupons");
  } catch {
    revalidatePath("/admin/coupons");
  }
}

export async function toggleCouponAction(formData: FormData) {
  await assertPermission("products.write");
  const id = formData.get("id")?.toString();
  const isActive = formData.get("isActive")?.toString() === "true";
  if (!id) return;
  await toggleCouponActive(id, isActive);
  revalidatePath("/admin/coupons");
}
