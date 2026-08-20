"use client";

import { Mail, MapPin, Package, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { transitionOrderAction } from "@/features/orders/actions";
import {
  KANBAN_COLUMNS,
  ORDER_TRANSITIONS,
  SALES_BOARD_GROUPS,
  statusLabel,
} from "@/features/orders/state-machine";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { OrderStatus, PaymentStatus } from "@/generated/prisma";

export type SalesOrderCard = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  totalAmount: number;
  createdAt: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  shippingCity: string | null;
  shippingMethod: string;
  shippingWarehouseRef: string | null;
  shippingAddressLine: string | null;
  customerNote: string | null;
  items: {
    id: string;
    productTitle: string;
    variantTitle: string;
    sku: string;
    quantity: number;
    unitPriceAmount: number;
  }[];
};

type ViewKey = "WORK" | "SHIPPING" | "DONE" | (typeof KANBAN_COLUMNS)[number]["key"];

function columnForStatus(status: OrderStatus) {
  return KANBAN_COLUMNS.find((column) => column.statuses.includes(status));
}

export function SalesBoard({ orders }: { orders: SalesOrderCard[] }) {
  const router = useRouter();
  const [group, setGroup] = useState<"WORK" | "SHIPPING" | "DONE">("WORK");
  const [statusFilter, setStatusFilter] = useState<ViewKey | "ALL">("ALL");
  const [pending, startTransition] = useTransition();

  const groupDef = SALES_BOARD_GROUPS.find((g) => g.key === group)!;
  const groupColumns = KANBAN_COLUMNS.filter((column) =>
    groupDef.columns.includes(column.key),
  );

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const column of KANBAN_COLUMNS) {
      map.set(
        column.key,
        orders.filter((order) => column.statuses.includes(order.status)).length,
      );
    }
    for (const g of SALES_BOARD_GROUPS) {
      const total = g.columns.reduce((sum, key) => sum + (map.get(key) ?? 0), 0);
      map.set(g.key, total);
    }
    return map;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const inGroup = orders.filter((order) => {
      const column = columnForStatus(order.status);
      if (!column) return false;
      return groupDef.columns.includes(column.key);
    });
    if (statusFilter === "ALL" || statusFilter === "WORK" || statusFilter === "SHIPPING" || statusFilter === "DONE") {
      return inGroup;
    }
    const column = KANBAN_COLUMNS.find((c) => c.key === statusFilter);
    if (!column) return inGroup;
    return inGroup.filter((order) => column.statuses.includes(order.status));
  }, [orders, groupDef.columns, statusFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {SALES_BOARD_GROUPS.map((g) => (
          <button
            key={g.key}
            type="button"
            onClick={() => {
              setGroup(g.key);
              setStatusFilter("ALL");
            }}
            className={cn(
              "rounded-2xl border px-4 py-3 text-left transition",
              group === g.key
                ? "border-primary bg-primary/10"
                : "border-border bg-surface hover:border-primary/40",
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">{g.label}</span>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs tabular-nums">
                {counts.get(g.key) ?? 0}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{g.hint}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold",
            statusFilter === "ALL"
              ? "border-primary bg-primary text-white"
              : "border-border bg-surface text-muted-foreground hover:text-foreground",
          )}
        >
          Усі в групі · {counts.get(group) ?? 0}
        </button>
        {groupColumns.map((column) => (
          <button
            key={column.key}
            type="button"
            onClick={() => setStatusFilter(column.key)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold",
              statusFilter === column.key
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            {column.label} · {counts.get(column.key) ?? 0}
          </button>
        ))}
      </div>

      {visibleOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
          У цій черзі замовлень немає
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleOrders.map((order) => (
            <SalesOrderCardView
              key={order.id}
              order={order}
              pending={pending}
              onTransition={(toStatus) => {
                const formData = new FormData();
                formData.set("orderId", order.id);
                formData.set("toStatus", toStatus);
                startTransition(async () => {
                  await transitionOrderAction(formData);
                  router.refresh();
                });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SalesOrderCardView({
  order,
  pending,
  onTransition,
}: {
  order: SalesOrderCard;
  pending: boolean;
  onTransition: (toStatus: OrderStatus) => void;
}) {
  const next = (ORDER_TRANSITIONS[order.status] ?? []).filter(
    (status) => status !== "CANCELLED" && status !== "RETURN_IN_PROGRESS",
  );
  const cancelOrReturn = (ORDER_TRANSITIONS[order.status] ?? []).filter(
    (status) => status === "CANCELLED" || status === "RETURN_IN_PROGRESS",
  );
  const paid = order.paymentStatus === "PAID" || order.paymentStatus === "COD_PAID";
  const columnKey = columnForStatus(order.status)?.key;

  return (
    <article className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/orders/${order.id}`}
              className="text-display text-lg font-semibold hover:text-primary"
            >
              {order.orderNumber}
            </Link>
            <span className="rounded-md bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              {statusLabel(columnKey === "ISSUE" ? "ISSUE" : order.status)}
            </span>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                paid ? "bg-success/15 text-success" : "bg-primary/15 text-primary",
              )}
            >
              {paid ? "Оплачено" : order.paymentStatus}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleString("uk-UA")} · повна передоплата
          </p>
        </div>
        <p className="text-xl font-bold text-primary">{formatMoney(order.totalAmount)}</p>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="space-y-1.5">
          <p className="font-semibold">
            {order.customerFirstName} {order.customerLastName}
          </p>
          <a
            href={`tel:${order.customerPhone}`}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-primary"
          >
            <Phone className="size-3.5 shrink-0" />
            {order.customerPhone}
          </a>
          <a
            href={`mailto:${order.customerEmail}`}
            className="flex items-center gap-1.5 break-all text-muted-foreground hover:text-primary"
          >
            <Mail className="size-3.5 shrink-0" />
            {order.customerEmail}
          </a>
        </div>
        <div className="space-y-1.5 text-muted-foreground">
          <p className="flex items-start gap-1.5">
            <MapPin className="mt-0.5 size-3.5 shrink-0" />
            <span>
              {order.shippingCity || "—"}
              {order.shippingMethod ? ` · ${order.shippingMethod}` : ""}
              {order.shippingWarehouseRef ? (
                <>
                  <br />
                  Відділення: {order.shippingWarehouseRef}
                </>
              ) : null}
              {order.shippingAddressLine ? (
                <>
                  <br />
                  {order.shippingAddressLine}
                </>
              ) : null}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border/80 bg-background/50 p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Package className="size-3.5" />
          Товари
        </p>
        <ul className="space-y-1.5 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span className="min-w-0">
                <span className="font-medium">{item.productTitle}</span>
                {item.variantTitle && item.variantTitle !== "Default" ? (
                  <span className="text-muted-foreground"> · {item.variantTitle}</span>
                ) : null}
                <span className="block text-xs text-muted-foreground">
                  {item.sku} · ×{item.quantity}
                </span>
              </span>
              <span className="shrink-0 tabular-nums">
                {formatMoney(item.unitPriceAmount * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {order.customerNote ? (
        <p className="mt-3 rounded-xl border border-border/80 bg-primary/5 px-3 py-2 text-sm">
          <span className="font-semibold text-muted-foreground">Коментар: </span>
          {order.customerNote}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button href={`/admin/orders/${order.id}`} variant="secondary" size="sm">
          Відкрити
        </Button>
        {next[0] ? (
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() => onTransition(next[0]!)}
          >
            → {statusLabel(next[0]!)}
          </Button>
        ) : null}
        {cancelOrReturn[0] ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => onTransition(cancelOrReturn[0]!)}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-danger hover:underline disabled:opacity-50"
          >
            {cancelOrReturn[0] === "CANCELLED" ? "Скасувати" : "Повернення"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
