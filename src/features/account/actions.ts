"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { ensureCustomerToken } from "@/features/account/cookie";
import { customerProfileSchema } from "@/features/account/schema";
import { saveCustomerProfile } from "@/features/account/service";

export async function saveCustomerProfileAction(formData: FormData) {
  const t = await getTranslations("account");
  const parsed = customerProfileSchema.safeParse({
    firstName: formData.get("firstName")?.toString() ?? "",
    lastName: formData.get("lastName")?.toString() ?? "",
    phone: formData.get("phone")?.toString() ?? "",
    city: formData.get("city")?.toString() ?? "",
    telegramUsername: formData.get("telegramUsername")?.toString() ?? "",
    birthDate: formData.get("birthDate")?.toString() ?? "",
    note: formData.get("note")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
  });

  if (!parsed.success) {
    return { ok: false as const, error: t("profileInvalid") };
  }

  try {
    await ensureCustomerToken();
    await saveCustomerProfile(parsed.data);
    revalidatePath("/account");
    revalidatePath("/account/settings");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: t("profileSaveFailed") };
  }
}
