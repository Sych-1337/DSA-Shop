import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requirePermission } from "@/lib/auth/rbac";
import { getMockEmailInbox } from "@/lib/providers/email/mock";

export const dynamic = "force-dynamic";

export default async function AdminEmailsPage() {
  await requirePermission("orders.read", "/admin/emails");
  const messages = getMockEmailInbox();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <AdminPageHeader
        title="Листи"
        description="Stub inbox: листи магазину зʼявляються тут замість SMTP. Після підключення провайдера — замінить лог."
        meta={`Повідомлень: ${messages.length}`}
      />

      {messages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Inbox порожній. Оформіть замовлення або прогоніть stub-оплату — листи зʼявляться автоматично.
        </div>
      ) : (
        <ul className="space-y-4">
          {messages.map((message) => (
            <li
              key={message.id}
              className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{message.subject}</p>
                  <p className="mt-1 text-sm text-muted-foreground">до {message.to}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(message.createdAt).toLocaleString("uk-UA")}
                </p>
              </div>
              <div
                className="mt-4 overflow-hidden rounded-xl border border-border bg-background p-3 text-sm"
                dangerouslySetInnerHTML={{ __html: message.html }}
              />
              {message.text ? (
                <pre className="mt-3 whitespace-pre-wrap text-xs text-muted-foreground">
                  {message.text}
                </pre>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
