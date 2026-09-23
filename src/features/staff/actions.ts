"use server";

import { revalidatePath } from "next/cache";

import {
  assignStaffRoles,
  createStaffUser,
  setStaffActive,
} from "@/features/staff/service";
import { assertPermission } from "@/lib/auth/rbac";

export async function createStaffAction(formData: FormData) {
  await assertPermission("staff.manage");
  const roleKeys = formData.getAll("roleKeys").map(String).filter(Boolean);
  try {
    await createStaffUser({
      name: formData.get("name")?.toString() ?? "",
      email: formData.get("email")?.toString() ?? "",
      password: formData.get("password")?.toString() ?? "",
      roleKeys,
      phone: formData.get("phone")?.toString() || undefined,
    });
    revalidatePath("/admin/staff");
  } catch {
    revalidatePath("/admin/staff");
  }
}

export async function toggleStaffActiveAction(formData: FormData) {
  await assertPermission("staff.manage");
  const userId = formData.get("userId")?.toString();
  const isActive = formData.get("isActive")?.toString() === "true";
  if (!userId) return;
  await setStaffActive(userId, isActive);
  revalidatePath("/admin/staff");
}

export async function assignStaffRolesAction(formData: FormData) {
  await assertPermission("staff.manage");
  const userId = formData.get("userId")?.toString();
  if (!userId) return;
  const roleKeys = formData.getAll("roleKeys").map(String).filter(Boolean);
  await assignStaffRoles(userId, roleKeys);
  revalidatePath("/admin/staff");
}
