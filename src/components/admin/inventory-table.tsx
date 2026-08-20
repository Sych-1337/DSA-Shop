"use client";

import { History, PackageMinus, PackagePlus, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  adjustStockAction,
  listMovementsAction,
  updateInventoryMetaAction,
} from "@/features/inventory/actions";
import type { InventoryRow } from "@/features/inventory/service";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

const MOVEMENT_LABEL: Record<string, string> = {
  PURCHASE_RECEIPT: "Прихід",
  WRITE_OFF: "Списання",
  MANUAL_ADJUSTMENT: "Коригування",
  SALE: "Продаж",
  RESERVATION: "Резерв",
  RESERVATION_RELEASE: "Зняття резерву",
  RETURN: "Повернення",
  TRANSFER_IN: "Трансфер +",
  TRANSFER_OUT: "Трансфер −",
};

type MovementItem = {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  createdAt: string;
};

function kopiykyToUahInput(value: number | null) {
  if (value == null) return "";
  return (value / 100).toFixed(value % 100 === 0 ? 0 : 2);
}

export function InventoryTable({
  rows,
  canAdjust,
  canSeeCost,
}: {
  rows: InventoryRow[];
  canAdjust: boolean;
  canSeeCost: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [adjustRow, setAdjustRow] = useState<InventoryRow | null>(null);
  const [historyRow, setHistoryRow] = useState<InventoryRow | null>(null);
  const [history, setHistory] = useState<MovementItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  function refresh() {
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-muted-foreground">
            <tr>
              <th className="px-3 py-3 font-medium">SKU</th>
              <th className="px-3 py-3 font-medium">Товар</th>
              <th className="px-3 py-3 font-medium">Варіант</th>
              <th className="px-3 py-3 font-medium">Склад</th>
              <th className="px-3 py-3 font-medium">В наявності</th>
              <th className="px-3 py-3 font-medium">Резерв</th>
              <th className="px-3 py-3 font-medium">Доступно</th>
              {canSeeCost ? <th className="px-3 py-3 font-medium">Собівартість</th> : null}
              <th className="px-3 py-3 font-medium">Ціна продажу</th>
              {canSeeCost ? <th className="px-3 py-3 font-medium">Маржа %</th> : null}
              <th className="px-3 py-3 font-medium">Reorder</th>
              <th className="px-3 py-3 font-medium">Дії</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={canSeeCost ? 12 : 10}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  Немає SKU за цими фільтрами. Створіть товар — він зʼявиться тут автоматично.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <InventoryRowView
                  key={row.inventoryItemId}
                  row={row}
                  canAdjust={canAdjust}
                  canSeeCost={canSeeCost}
                  pending={pending}
                  onError={setError}
                  onSaved={refresh}
                  onAdjust={() => setAdjustRow(row)}
                  onHistory={() => {
                    setHistoryRow(row);
                    setHistoryLoading(true);
                    void listMovementsAction(row.inventoryItemId).then((result) => {
                      setHistoryLoading(false);
                      if (result.ok) setHistory([...result.items]);
                      else setError(result.error);
                    });
                  }}
                  startTransition={startTransition}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {adjustRow ? (
        <AdjustDialog
          row={adjustRow}
          pending={pending}
          onClose={() => setAdjustRow(null)}
          onSubmit={(formData) => {
            setError(null);
            startTransition(async () => {
              const result = await adjustStockAction(formData);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setAdjustRow(null);
              refresh();
            });
          }}
        />
      ) : null}

      {historyRow ? (
        <HistoryDialog
          row={historyRow}
          loading={historyLoading}
          items={history}
          onClose={() => setHistoryRow(null)}
        />
      ) : null}
    </div>
  );
}

function InventoryRowView({
  row,
  canAdjust,
  canSeeCost,
  pending,
  onError,
  onSaved,
  onAdjust,
  onHistory,
  startTransition,
}: {
  row: InventoryRow;
  canAdjust: boolean;
  canSeeCost: boolean;
  pending: boolean;
  onError: (message: string | null) => void;
  onSaved: () => void;
  onAdjust: () => void;
  onHistory: () => void;
  startTransition: (fn: () => void) => void;
}) {
  const [costUah, setCostUah] = useState(kopiykyToUahInput(row.costPriceAmount));
  const [reorder, setReorder] = useState(String(row.reorderPoint));

  useEffect(() => {
    setCostUah(kopiykyToUahInput(row.costPriceAmount));
    setReorder(String(row.reorderPoint));
  }, [row.costPriceAmount, row.reorderPoint, row.inventoryItemId]);

  function saveMeta() {
    if (!canAdjust) return;
    const formData = new FormData();
    formData.set("inventoryItemId", row.inventoryItemId);
    if (canSeeCost) formData.set("costPriceUah", costUah);
    formData.set("reorderPoint", reorder);
    onError(null);
    startTransition(async () => {
      const result = await updateInventoryMetaAction(formData);
      if (!result.ok) {
        onError(result.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-3 font-mono text-xs">{row.sku}</td>
      <td className="px-3 py-3">
        <Link
          href={`/admin/products/${row.productId}`}
          className="font-medium hover:text-primary"
        >
          {row.productTitle}
        </Link>
      </td>
      <td className="px-3 py-3 text-muted-foreground">{row.variantTitle}</td>
      <td className="px-3 py-3">{row.warehouseName}</td>
      <td className={cn("px-3 py-3 tabular-nums", row.isLowStock && "font-bold text-danger")}>
        {row.onHand}
      </td>
      <td className="px-3 py-3 tabular-nums">{row.reserved}</td>
      <td className="px-3 py-3 tabular-nums font-medium">{row.available}</td>
      {canSeeCost ? (
        <td className="px-3 py-3">
          <input
            type="number"
            min={0}
            step="0.01"
            disabled={!canAdjust || pending}
            value={costUah}
            onChange={(e) => setCostUah(e.target.value)}
            onBlur={saveMeta}
            placeholder="—"
            className="h-9 w-24 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary disabled:opacity-50"
          />
        </td>
      ) : null}
      <td className="px-3 py-3 tabular-nums">{formatMoney(row.priceAmount)}</td>
      {canSeeCost ? (
        <td
          className={cn(
            "px-3 py-3 tabular-nums",
            row.marginPercent != null && row.marginPercent < 20 && "text-danger",
            row.marginPercent != null && row.marginPercent >= 40 && "text-success",
          )}
        >
          {row.marginPercent != null ? `${row.marginPercent}%` : "—"}
        </td>
      ) : null}
      <td className="px-3 py-3">
        <input
          type="number"
          min={0}
          disabled={!canAdjust || pending}
          value={reorder}
          onChange={(e) => setReorder(e.target.value)}
          onBlur={saveMeta}
          className="h-9 w-16 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary disabled:opacity-50"
        />
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1">
          {canAdjust ? (
            <button
              type="button"
              title="Рух складу"
              onClick={onAdjust}
              className="inline-flex size-9 items-center justify-center rounded-lg border border-border hover:border-primary hover:text-primary"
            >
              <SlidersHorizontal className="size-4" />
            </button>
          ) : null}
          <button
            type="button"
            title="Історія рухів"
            onClick={onHistory}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-border hover:border-primary hover:text-primary"
          >
            <History className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function AdjustDialog({
  row,
  pending,
  onClose,
  onSubmit,
}: {
  row: InventoryRow;
  pending: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}) {
  const titleId = useId();
  const [type, setType] = useState<"PURCHASE_RECEIPT" | "WRITE_OFF" | "MANUAL_ADJUSTMENT">(
    "PURCHASE_RECEIPT",
  );
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Закрити" onClick={onClose} />
      <div
        role="dialog"
        aria-modal
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-t-[1.5rem] border border-border bg-background p-5 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-display text-xl font-semibold">
              Рух складу
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {row.sku} · {row.productTitle} ({row.variantTitle})
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Зараз: {row.onHand} · доступно {row.available} · резерв {row.reserved}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-full border border-border"
          >
            <X className="size-4" />
          </button>
        </div>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            onSubmit(formData);
          }}
        >
          <input type="hidden" name="inventoryItemId" value={row.inventoryItemId} />
          <input type="hidden" name="expectedVersion" value={row.version} />

          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: "PURCHASE_RECEIPT", label: "Прихід", icon: PackagePlus },
                { id: "WRITE_OFF", label: "Списання", icon: PackageMinus },
                { id: "MANUAL_ADJUSTMENT", label: "Кориг.", icon: SlidersHorizontal },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setType(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-semibold",
                  type === item.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </button>
            ))}
          </div>
          <input type="hidden" name="type" value={type} />

          <label className="block space-y-1 text-sm">
            <span className="text-muted-foreground">
              {type === "MANUAL_ADJUSTMENT"
                ? "Дельта (+ додати / − зняти)"
                : "Кількість"}
            </span>
            <input
              name="quantity"
              type="number"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 outline-none focus:border-primary"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-muted-foreground">Причина</span>
            <input
              name="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Наприклад: поставка від постачальника"
              className="h-11 w-full rounded-xl border border-border bg-surface px-3 outline-none focus:border-primary"
            />
          </label>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? "Збереження…" : "Підтвердити"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Скасувати
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HistoryDialog({
  row,
  loading,
  items,
  onClose,
}: {
  row: InventoryRow;
  loading: boolean;
  items: MovementItem[];
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Закрити" onClick={onClose} />
      <div
        role="dialog"
        aria-modal
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.5rem] border border-border bg-background shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 id={titleId} className="text-display text-xl font-semibold">
              Історія рухів
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {row.sku} · {row.productTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-full border border-border"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Завантаження…</p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Рухів ще немає</p>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">
                      {MOVEMENT_LABEL[item.type] ?? item.type}
                    </span>
                    <span className="tabular-nums font-medium">
                      {item.quantity > 0 && item.type === "MANUAL_ADJUSTMENT" ? "+" : ""}
                      {item.type === "WRITE_OFF" || item.type === "SALE" ? "−" : ""}
                      {Math.abs(item.quantity)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString("uk-UA")}
                    {item.reason ? ` · ${item.reason}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
