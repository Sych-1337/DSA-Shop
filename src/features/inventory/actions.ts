"use server";

import { revalidatePath } from "next/cache";

import {
  adjustStock,
  listStockMovements,
  updateInventoryMeta,
} from "@/features/inventory/service";
import { assertPermission, getStaffContext } from "@/lib/auth/rbac";

function revalidateInventory() {
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
}

export async function adjustStockAction(formData: FormData) {
  const staff = await assertPermission("inventory.adjust");
  const inventoryItemId = formData.get("inventoryItemId")?.toString();
  const type = formData.get("type")?.toString() as
    | "PURCHASE_RECEIPT"
    | "WRITE_OFF"
    | "MANUAL_ADJUSTMENT"
    | undefined;
  const quantity = Number(formData.get("quantity")?.toString());
  const reason = formData.get("reason")?.toString() || undefined;
  const expectedVersionRaw = formData.get("expectedVersion")?.toString();
  const expectedVersion =
    expectedVersionRaw != null && expectedVersionRaw !== ""
      ? Number(expectedVersionRaw)
      : undefined;

  if (!inventoryItemId || !type) {
    return { ok: false as const, error: "Невірні дані руху" };
  }
  if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity === 0) {
    return { ok: false as const, error: "Вкажіть ненульову цілу кількість" };
  }

  try {
    await adjustStock({
      inventoryItemId,
      type,
      quantity,
      reason,
      actorId: staff.userId,
      expectedVersion: Number.isInteger(expectedVersion) ? expectedVersion : undefined,
    });
    revalidateInventory();
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Помилка руху складу",
    };
  }
}

export async function updateInventoryMetaAction(formData: FormData) {
  await assertPermission("inventory.adjust");
  const staff = await getStaffContext();
  const inventoryItemId = formData.get("inventoryItemId")?.toString();
  if (!inventoryItemId) return { ok: false as const, error: "Немає id" };

  const costRaw = formData.get("costPriceUah");
  const reorderRaw = formData.get("reorderPoint")?.toString();

  let costPriceAmount: number | null | undefined = undefined;
  if (costRaw != null) {
    if (!staff?.permissions.has("products.cost.read")) {
      return { ok: false as const, error: "Немає доступу до собівартості" };
    }
    const text = costRaw.toString().trim();
    if (text === "") {
      costPriceAmount = null;
    } else {
      const uah = Number(text.replace(",", "."));
      if (!Number.isFinite(uah) || uah < 0) {
        return { ok: false as const, error: "Некоректна собівартість" };
      }
      costPriceAmount = Math.round(uah * 100);
    }
  }

  let reorderPoint: number | undefined;
  if (reorderRaw != null && reorderRaw !== "") {
    reorderPoint = Number(reorderRaw);
    if (!Number.isInteger(reorderPoint) || reorderPoint < 0) {
      return { ok: false as const, error: "Некоректний reorder" };
    }
  }

  try {
    await updateInventoryMeta({
      inventoryItemId,
      costPriceAmount,
      reorderPoint,
    });
    revalidateInventory();
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Помилка збереження",
    };
  }
}

export async function listMovementsAction(inventoryItemId: string) {
  await assertPermission("inventory.read");
  if (!inventoryItemId) return { ok: false as const, error: "Немає id", items: [] as const };
  const items = await listStockMovements(inventoryItemId);
  return {
    ok: true as const,
    items: items.map((m) => ({
      id: m.id,
      type: m.type,
      quantity: m.quantity,
      reason: m.reason,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}
