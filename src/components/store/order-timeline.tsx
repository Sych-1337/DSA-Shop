import { getTranslations } from "next-intl/server";

import { buildOrderTimeline } from "@/features/orders/timeline";

export async function OrderTimeline({
  status,
  paymentStatus,
  fulfillmentStatus,
}: {
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
}) {
  const t = await getTranslations("track");
  const steps = buildOrderTimeline({ status, paymentStatus, fulfillmentStatus });
  const cancelled = status === "CANCELLED";

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <h2 className="text-display text-lg font-semibold">{t("timelineTitle")}</h2>
      {cancelled ? (
        <p className="mt-3 text-sm text-danger">{t("timelineCancelled")}</p>
      ) : null}
      <ol className="mt-5 space-y-0">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const tone = step.done
            ? "bg-success"
            : step.current
              ? "bg-primary"
              : "bg-border";
          return (
            <li key={step.id} className="relative flex gap-3 pb-5 last:pb-0">
              {!isLast ? (
                <span
                  className={`absolute top-3 left-[7px] h-[calc(100%-0.5rem)] w-0.5 ${
                    step.done ? "bg-success/50" : "bg-border"
                  }`}
                  aria-hidden
                />
              ) : null}
              <span
                className={`relative z-[1] mt-1 size-3.5 shrink-0 rounded-full ${tone} ${
                  step.current ? "ring-4 ring-primary/20" : ""
                }`}
                aria-hidden
              />
              <div>
                <p
                  className={`text-sm font-medium ${
                    step.done || step.current ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {t(`timeline.${step.id}`)}
                </p>
                {step.current ? (
                  <p className="text-xs text-muted-foreground">{t("timelineCurrent")}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
