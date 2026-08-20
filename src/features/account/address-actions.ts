"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { customerAddressSchema } from "@/features/account/address-schema";
import {
  createCustomerAddress,
  deleteCustomerAddress,
  setDefaultCustomerAddress,
} from "@/features/account/address-service";
import { ensureCustomerToken } from "@/features/account/cookie";
import { ShippingMethod } from "@/generated/prisma";

function parseAddressForm(formData: FormData) {
  return customerAddressSchema.safeParse({
    label: formData.get("label")?.toString() || "Доставка",
    firstName: formData.get("firstName")?.toString() ?? "",
    lastName: formData.get("lastName")?.toString() ?? "",
    phone: formData.get("phone")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    city: formData.get("city")?.toString() ?? "",
    cityRef: formData.get("cityRef")?.toString() ?? "",
    shippingMethod: (formData.get("shippingMethod")?.toString() ??
      ShippingMethod.WAREHOUSE) as ShippingMethod,
    warehouseRef: formData.get("warehouseRef")?.toString() ?? "",
    addressLine: formData.get("addressLine")?.toString() ?? "",
    isDefault: formData.get("isDefault") === "on" || formData.get("isDefault") === "true",
  });
}

export async function createCustomerAddressAction(formData: FormData) {
  const t = await getTranslations("account");
  const parsed = parseAddressForm(formData);
  if (!parsed.success) {
    return { ok: false as const, error: t("addressInvalid") };
  }

  try {
    await ensureCustomerToken();
    await createCustomerAddress(parsed.data);
    revalidatePath("/account/addresses");
    revalidatePath("/checkout");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: t("addressSaveFailed") };
  }
}

export async function deleteCustomerAddressAction(formData: FormData) {
  const t = await getTranslations("account");
  const id = formData.get("addressId")?.toString();
  if (!id) return { ok: false as const, error: t("addressNotFound") };

  try {
    await deleteCustomerAddress(id);
    revalidatePath("/account/addresses");
    revalidatePath("/checkout");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: t("addressNotFound") };
  }
}

export async function setDefaultCustomerAddressAction(formData: FormData) {
  const t = await getTranslations("account");
  const id = formData.get("addressId")?.toString();
  if (!id) return { ok: false as const, error: t("addressNotFound") };

  try {
    await setDefaultCustomerAddress(id);
    revalidatePath("/account/addresses");
    revalidatePath("/checkout");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: t("addressNotFound") };
  }
}
