"use server";

import { revalidatePath } from "next/cache";

import {
  addCommissionAdjustment,
  ensureCurrentDraftPeriod,
  lockSettlementPeriod,
  rebuildDraftPeriod,
  recordCommissionPayment,
} from "@/features/commission/service";
import { assertPermission } from "@/lib/auth/rbac";

export async function ensureDraftPeriodAction() {
  await assertPermission("commissions.manage");
  await ensureCurrentDraftPeriod();
  revalidatePath("/admin/commissions");
}

export async function rebuildPeriodAction(formData: FormData) {
  await assertPermission("commissions.manage");
  const periodId = formData.get("periodId")?.toString();
  if (!periodId) return;
  await rebuildDraftPeriod(periodId);
  revalidatePath("/admin/commissions");
  revalidatePath(`/admin/commissions/${periodId}`);
}

export async function lockPeriodAction(formData: FormData) {
  await assertPermission("commissions.manage");
  const periodId = formData.get("periodId")?.toString();
  if (!periodId) return;
  await lockSettlementPeriod(periodId);
  revalidatePath("/admin/commissions");
  revalidatePath(`/admin/commissions/${periodId}`);
}

export async function addAdjustmentAction(formData: FormData) {
  await assertPermission("commissions.manage");
  const periodId = formData.get("periodId")?.toString();
  const reason = formData.get("reason")?.toString() ?? "";
  const amount = Number(formData.get("amount"));
  const orderId = formData.get("orderId")?.toString() || undefined;
  if (!periodId || !reason || !Number.isInteger(amount)) return;

  await addCommissionAdjustment({ periodId, amount, reason, orderId });
  revalidatePath(`/admin/commissions/${periodId}`);
  revalidatePath("/admin/commissions");
}

export async function recordPaymentAction(formData: FormData) {
  await assertPermission("commissions.manage");
  const periodId = formData.get("periodId")?.toString();
  const amount = Number(formData.get("amount"));
  const method = formData.get("method")?.toString() || undefined;
  const note = formData.get("note")?.toString() || undefined;
  if (!periodId || !Number.isInteger(amount) || amount <= 0) return;

  await recordCommissionPayment({ periodId, amount, method, note });
  revalidatePath(`/admin/commissions/${periodId}`);
  revalidatePath("/admin/commissions");
}
