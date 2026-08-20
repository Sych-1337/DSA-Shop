"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

import { ReturnRequestStatus } from "@/generated/prisma";
import { returnRequestSchema } from "@/features/returns/schema";
import {
  createCustomerReturnRequest,
  lookupReturnableOrder,
  transitionReturnRequest,
} from "@/features/returns/service";
import { assertPermission } from "@/lib/auth/rbac";
import { rateLimit } from "@/lib/security/rate-limit";

export async function lookupReturnOrderAction(formData: FormData) {
  const orderNumber = formData.get("orderNumber")?.toString() ?? "";
  const email = formData.get("email")?.toString() ?? "";
  if (!orderNumber || !email) {
    return { ok: false as const, error: "Вкажіть номер замовлення та email" };
  }

  const order = await lookupReturnableOrder(orderNumber, email);
  if (!order) {
    return { ok: false as const, error: "Замовлення не знайдено" };
  }

  return {
    ok: true as const,
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      hasOpenReturn: order.returnRequests.length > 0,
      items: order.items.map((item) => ({
        id: item.id,
        productTitle: item.productTitle,
        variantTitle: item.variantTitle,
        sku: item.sku,
        quantity: item.quantity,
        lineTotalAmount: item.lineTotalAmount,
      })),
    },
  };
}

export async function submitReturnRequestAction(formData: FormData) {
  const t = await getTranslations("errors");
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const limited = rateLimit({ key: `return:${ip}`, limit: 10, windowMs: 60_000 });
  if (!limited.ok) {
    return { ok: false as const, error: t("rateLimited") };
  }

  const itemIds = formData
    .getAll("itemIds")
    .map((value) => value.toString())
    .filter(Boolean);

  const parsed = returnRequestSchema.safeParse({
    orderNumber: formData.get("orderNumber")?.toString(),
    email: formData.get("email")?.toString(),
    reason: formData.get("reason")?.toString(),
    customerNote: formData.get("customerNote")?.toString() || undefined,
    itemIds,
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Перевірте поля форми",
    };
  }

  try {
    const created = await createCustomerReturnRequest(parsed.data);
    revalidatePath("/admin/returns");
    revalidatePath("/admin/sales");
    revalidatePath(`/admin/orders/${created.orderId}`);
    return {
      ok: true as const,
      id: created.id,
      orderNumber: created.order.orderNumber,
    };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Не вдалося створити заявку",
    };
  }
}

export async function transitionReturnAction(formData: FormData) {
  const staff = await assertPermission("orders.write");
  const id = formData.get("id")?.toString();
  const toStatus = formData.get("toStatus")?.toString() as ReturnRequestStatus | undefined;
  const adminNote = formData.get("adminNote")?.toString() || undefined;
  const restock = formData.get("restock")?.toString() !== "0";

  if (!id || !toStatus) {
    return { ok: false as const, error: "Невірні дані" };
  }

  try {
    await transitionReturnRequest({
      id,
      toStatus,
      adminNote,
      actorId: staff.userId,
      restock,
    });
    revalidatePath("/admin/returns");
    revalidatePath("/admin/sales");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/orders");
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Помилка оновлення",
    };
  }
}
