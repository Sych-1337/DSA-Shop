"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  lookupReturnOrderAction,
  submitReturnRequestAction,
} from "@/features/returns/actions";
import { formatMoney } from "@/lib/money";

type LookupItem = {
  id: string;
  productTitle: string;
  variantTitle: string;
  sku: string;
  quantity: number;
  lineTotalAmount: number;
};

type LookupOrder = {
  id: string;
  orderNumber: string;
  status: string;
  hasOpenReturn: boolean;
  items: LookupItem[];
};

const REASONS = ["NOT_SUITABLE", "WRONG_ITEM", "DEFECT", "OTHER"] as const;

export function ReturnRequestForm() {
  const t = useTranslations("returnsForm");
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<"lookup" | "details" | "done">("lookup");
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<LookupOrder | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [reason, setReason] = useState<(typeof REASONS)[number]>("NOT_SUITABLE");
  const [note, setNote] = useState("");

  const allSelected = useMemo(
    () => order != null && selected.length === order.items.length && order.items.length > 0,
    [order, selected],
  );

  return (
    <div className="mt-10 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
      <h2 className="text-display text-2xl font-semibold">{t("title")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t("lead")}</p>

      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      {step === "done" ? (
        <div className="mt-6 space-y-3 rounded-xl border border-success/30 bg-success/10 p-4 text-sm">
          <p className="font-semibold text-success">{t("successTitle")}</p>
          <p>{t("successBody")}</p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setStep("lookup");
              setOrder(null);
              setSelected([]);
              setNote("");
              setError(null);
            }}
          >
            {t("another")}
          </Button>
        </div>
      ) : null}

      {step === "lookup" ? (
        <form
          className="mt-6 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            setError(null);
            startTransition(async () => {
              const result = await lookupReturnOrderAction(data);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              if (result.order.hasOpenReturn) {
                setError(t("alreadyOpen"));
                return;
              }
              setOrder(result.order);
              setOrderNumber(result.order.orderNumber);
              setEmail(String(data.get("email") ?? ""));
              setSelected(result.order.items.map((item) => item.id));
              setStep("details");
            });
          }}
        >
          <label className="block space-y-1 text-sm">
            <span>{t("orderNumber")}</span>
            <input
              name="orderNumber"
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="KW-…"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 font-mono text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>{t("email")}</span>
            <input
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary"
            />
          </label>
          <Button type="submit" disabled={pending}>
            {pending ? t("looking") : t("continue")}
          </Button>
        </form>
      ) : null}

      {step === "details" && order ? (
        <form
          className="mt-6 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (selected.length === 0) {
              setError(t("pickItems"));
              return;
            }
            const data = new FormData();
            data.set("orderNumber", orderNumber);
            data.set("email", email);
            data.set("reason", reason);
            data.set("customerNote", note);
            for (const id of selected) data.append("itemIds", id);
            setError(null);
            startTransition(async () => {
              const result = await submitReturnRequestAction(data);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setStep("done");
            });
          }}
        >
          <p className="text-sm">
            <span className="text-muted-foreground">{t("order")}: </span>
            <span className="font-semibold">{order.orderNumber}</span>
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{t("items")}</p>
              <button
                type="button"
                className="text-xs text-primary underline-offset-2 hover:underline"
                onClick={() =>
                  setSelected(allSelected ? [] : order.items.map((item) => item.id))
                }
              >
                {allSelected ? t("unselectAll") : t("selectAll")}
              </button>
            </div>
            <ul className="space-y-2">
              {order.items.map((item) => {
                const checked = selected.includes(item.id);
                return (
                  <li key={item.id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border px-3 py-3 text-sm hover:border-primary/40">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelected((prev) =>
                            checked ? prev.filter((id) => id !== item.id) : [...prev, item.id],
                          )
                        }
                        className="mt-1"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">{item.productTitle}</span>
                        {item.variantTitle && item.variantTitle !== "Default" ? (
                          <span className="text-muted-foreground"> · {item.variantTitle}</span>
                        ) : null}
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {item.sku} · ×{item.quantity} · {formatMoney(item.lineTotalAmount)}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>

          <label className="block space-y-1 text-sm">
            <span>{t("reason")}</span>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as (typeof REASONS)[number])}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary"
            >
              {REASONS.map((value) => (
                <option key={value} value={value}>
                  {t(`reasons.${value}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-sm">
            <span>{t("note")}</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder={t("notePlaceholder")}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? t("submitting") : t("submit")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setStep("lookup");
                setOrder(null);
              }}
            >
              {t("back")}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
