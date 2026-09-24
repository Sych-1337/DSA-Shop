import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requirePermission } from "@/lib/auth/rbac";

export default async function AdminSettingsPage() {
  await requirePermission("settings.manage", "/admin/settings");

  const fopConfigured = Boolean(process.env.FOP_NAME?.trim() && process.env.FOP_IBAN?.trim());
  const wfpConfigured = Boolean(
    process.env.WAYFORPAY_MERCHANT_ACCOUNT?.trim() && process.env.WAYFORPAY_SECRET_KEY?.trim(),
  );
  const emailProvider = (process.env.EMAIL_PROVIDER ?? "mock").toLowerCase();
  const paymentProvider = (process.env.PAYMENT_PROVIDER ?? "mock").toLowerCase();
  const appUrl = process.env.APP_URL ?? "";
  const cronSet = Boolean(process.env.CRON_SECRET?.trim());

  const mask = (value?: string) => {
    if (!value) return "— не задано —";
    if (value.length < 8) return "••••";
    return `${value.slice(0, 3)}••••${value.slice(-2)}`;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <AdminPageHeader
        title="Налаштування"
        description="Секрети лише в env Render. Тут — статус soft-launch конфігурації."
      />

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">Сайт</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">APP_URL</dt>
            <dd className="text-right break-all">{appUrl || "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">NODE_ENV</dt>
            <dd>{process.env.NODE_ENV}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">Реквізити ФОП</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {fopConfigured ? "Налаштовано" : "Заповніть FOP_NAME + FOP_IBAN у env"}
        </p>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">ПІБ</dt>
            <dd>{process.env.FOP_NAME || "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">IBAN</dt>
            <dd className="font-mono text-xs">{mask(process.env.FOP_IBAN)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">ЄДРПОУ</dt>
            <dd>{process.env.FOP_EDRPOU || "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">Оплата</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">PAYMENT_PROVIDER</dt>
            <dd>{paymentProvider}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">WayForPay</dt>
            <dd>{wfpConfigured ? "ключі задані" : "не налаштовано"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Merchant</dt>
            <dd>{mask(process.env.WAYFORPAY_MERCHANT_ACCOUNT)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">Email / Cron</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">EMAIL_PROVIDER</dt>
            <dd>{emailProvider}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">EMAIL_FROM</dt>
            <dd className="text-right break-all">{process.env.EMAIL_FROM || "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">CRON_SECRET</dt>
            <dd>{cronSet ? "задано" : "відсутній"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">UNPAID_ORDER_CANCEL_HOURS</dt>
            <dd>{process.env.UNPAID_ORDER_CANCEL_HOURS || "48"}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
