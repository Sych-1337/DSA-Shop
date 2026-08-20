"use server";

import { revalidatePath } from "next/cache";

import { OrderStatus } from "@/generated/prisma";
import {
  addOrderNote,
  createShipmentForOrder,
  markOrderPaidManually,
  transitionOrderStatus,
} from "@/features/orders/admin-service";
import { assertPermission } from "@/lib/auth/rbac";

export async function transitionOrderAction(formData: FormData) {
  await assertPermission("orders.write");
  const orderId = formData.get("orderId")?.toString();
  const toStatus = formData.get("toStatus")?.toString() as OrderStatus | undefined;
  const reason = formData.get("reason")?.toString() || undefined;
  if (!orderId || !toStatus) return;

  await transitionOrderStatus({ orderId, toStatus, reason });
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/sales");
}

export async function addOrderNoteAction(formData: FormData) {
  await assertPermission("orders.write");
  const orderId = formData.get("orderId")?.toString();
  const body = formData.get("body")?.toString() ?? "";
  if (!orderId || body.trim().length < 2) return;

  await addOrderNote({ orderId, body });
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function createShipmentAction(formData: FormData) {
  await assertPermission("orders.write");
  const orderId = formData.get("orderId")?.toString();
  if (!orderId) return;

  await createShipmentForOrder(orderId);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/sales");
  revalidatePath("/admin/shipments");
}

export async function markOrderPaidAction(formData: FormData) {
  const staff = await assertPermission("payments.manualMark");
  const orderId = formData.get("orderId")?.toString();
  const reason = formData.get("reason")?.toString() || undefined;
  if (!orderId) return;

  await markOrderPaidManually({
    orderId,
    reason,
    actorId: staff.userId === "bypass" ? undefined : staff.userId,
  });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/sales");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/emails");
}
