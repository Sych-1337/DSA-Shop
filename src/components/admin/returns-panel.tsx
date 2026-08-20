"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { transitionReturnAction } from "@/features/returns/actions";
import { returnReasonLabel, returnStatusLabel } from "@/features/returns/labels";
import { formatMoney } from "@/lib/money";
import type { ReturnReason, ReturnRequestStatus } from "@/generated/prisma";
import { cn } from "@/lib/utils";

export type AdminReturnRow = {
  id: string;
  status: ReturnRequestStatus;
  reason: ReturnReason;
  customerNote: string | null;
  adminNote: string | null;
  refundAmount: number | null;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    customerFirstName: string;
    customerLastName: string;
    customerEmail: string;
    customerPhone: string;
    totalAmount: number;
    status: string;
    paymentStatus: string;
  };
  items: {
    id: string;
    quantity: number;
    productTitle: string;
    variantTitle: string;
    sku: string;
  }[];
};

const NEXT: Record<ReturnRequestStatus, ReturnRequestStatus[]> = {
  REQUESTED: ["APPROVED", "REJECTED"],
  APPROVED: ["RECEIVED", "REJECTED"],
  RECEIVED: ["REFUNDED"],
  REJECTED: [],
  REFUNDED: [],
  CANCELLED: [],
};

export function ReturnsPanel({
  rows,
  canWrite,
}: {
  rows: AdminReturnRow[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
          Заявок на повернення поки немає
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => {
            const next = NEXT[row.status];
            return (
              <article
                key={row.id}
                className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/orders/${row.order.id}`}
                        className="text-display text-lg font-semibold hover:text-primary"
                      >
                        {row.order.orderNumber}
                      </Link>
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                          row.status === "REQUESTED" && "bg-primary/15 text-primary",
                          row.status === "REFUNDED" && "bg-success/15 text-success",
                          (row.status === "REJECTED" || row.status === "CANCELLED") &&
                            "bg-danger/15 text-danger",
                          (row.status === "APPROVED" || row.status === "RECEIVED") &&
                            "bg-surface-muted text-foreground",
                        )}
                      >
                        {returnStatusLabel(row.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(row.createdAt).toLocaleString("uk-UA")} ·{" "}
                      {returnReasonLabel(row.reason)}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-primary">
                    {formatMoney(row.refundAmount ?? 0)}
                  </p>
                </div>

                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <p className="font-semibold">
                      {row.order.customerFirstName} {row.order.customerLastName}
                    </p>
                    <p className="text-muted-foreground">{row.order.customerPhone}</p>
                    <p className="text-muted-foreground">{row.order.customerEmail}</p>
                  </div>
                  <ul className="space-y-1 text-muted-foreground">
                    {row.items.map((item) => (
                      <li key={item.id}>
                        {item.productTitle}
                        {item.variantTitle !== "Default" ? ` · ${item.variantTitle}` : ""} ×
                        {item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>

                {row.customerNote ? (
                  <p className="mt-3 rounded-xl bg-background/60 px-3 py-2 text-sm">
                    <span className="font-semibold text-muted-foreground">Коментар покупця: </span>
                    {row.customerNote}
                  </p>
                ) : null}

                {canWrite && next.length > 0 ? (
                  <div className="mt-4 space-y-2 border-t border-border pt-4">
                    <input
                      value={notes[row.id] ?? ""}
                      onChange={(e) =>
                        setNotes((prev) => ({ ...prev, [row.id]: e.target.value }))
                      }
                      placeholder="Нотатка адміна (опційно)"
                      className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                    />
                    <div className="flex flex-wrap gap-2">
                      {next.map((status) => (
                        <Button
                          key={status}
                          type="button"
                          size="sm"
                          variant={status === "REJECTED" ? "secondary" : "primary"}
                          disabled={pending}
                          onClick={() => {
                            const formData = new FormData();
                            formData.set("id", row.id);
                            formData.set("toStatus", status);
                            formData.set("adminNote", notes[row.id] ?? "");
                            if (status === "REFUNDED") formData.set("restock", "1");
                            setError(null);
                            startTransition(async () => {
                              const result = await transitionReturnAction(formData);
                              if (!result.ok) {
                                setError(result.error);
                                return;
                              }
                              router.refresh();
                            });
                          }}
                        >
                          {status === "APPROVED" && "Схвалити"}
                          {status === "RECEIVED" && "Товар отримано"}
                          {status === "REFUNDED" && "Повернути кошти + на склад"}
                          {status === "REJECTED" && "Відхилити"}
                        </Button>
                      ))}
                      {row.status === "RECEIVED" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={pending}
                          onClick={() => {
                            const formData = new FormData();
                            formData.set("id", row.id);
                            formData.set("toStatus", "REFUNDED");
                            formData.set("adminNote", notes[row.id] ?? "");
                            formData.set("restock", "0");
                            setError(null);
                            startTransition(async () => {
                              const result = await transitionReturnAction(formData);
                              if (!result.ok) {
                                setError(result.error);
                                return;
                              }
                              router.refresh();
                            });
                          }}
                        >
                          Повернути кошти без складу
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
