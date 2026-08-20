"use client";

import { Apple, Mail, MessageCircle, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { AccountEmailAuth } from "@/components/store/account-email-auth";
import { Button } from "@/components/ui/button";
import { saveCustomerProfileAction } from "@/features/account/actions";
import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";

type ProfileView = {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  telegramUsername: string;
  birthDate: string;
  note: string;
  email: string;
};

type ListSummary = {
  id: string;
  name: string;
  isDefault: boolean;
  itemCount: number;
};

const AUTH_PROVIDERS = [
  { id: "google", icon: Sparkles, labelKey: "authGoogle" as const },
  { id: "apple", icon: Apple, labelKey: "authApple" as const },
  { id: "email", icon: Mail, labelKey: "authEmail" as const },
  { id: "telegram", icon: MessageCircle, labelKey: "authTelegram" as const },
];

export function AccountCabinet({
  profile,
  lists,
  signedIn,
}: {
  profile: ProfileView;
  lists: ListSummary[];
  signedIn: boolean;
}) {
  const t = useTranslations("account");
  const tPages = useTranslations("pages");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);

  return (
    <div className="mt-8 space-y-8">
      {signedIn ? (
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await authClient.signOut();
                router.refresh();
              });
            }}
          >
            {t("authSignOut")}
          </Button>
        </div>
      ) : (
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
          <h2 className="text-display text-xl font-semibold">{t("authTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("authLead")}</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {AUTH_PROVIDERS.map((provider) => {
              const Icon = provider.icon;
              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => {
                    if (provider.id === "email") {
                      setEmailOpen(true);
                      setAuthNotice(null);
                      return;
                    }
                    setEmailOpen(false);
                    setAuthNotice(t("authStubNotice"));
                  }}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-medium transition hover:border-primary"
                >
                  <Icon className="size-4" />
                  {t(provider.labelKey)}
                </button>
              );
            })}
          </div>
          {emailOpen ? <AccountEmailAuth /> : null}
          {!emailOpen && authNotice ? (
            <p className="mt-3 text-sm text-muted-foreground">{authNotice}</p>
          ) : null}
          {!emailOpen && !authNotice ? (
            <p className="mt-3 text-xs text-muted-foreground">{t("authGuestHint")}</p>
          ) : null}
        </section>
      )}

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="text-display text-xl font-semibold">{t("profileTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("profileLead")}</p>

        <form
          className="mt-5 grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            setSaved(false);
            const formData = new FormData(event.currentTarget);
            startTransition(async () => {
              const result = await saveCustomerProfileAction(formData);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setSaved(true);
            });
          }}
        >
          <label className="block text-sm sm:col-span-1">
            <span className="mb-1.5 block text-muted-foreground">{t("firstName")}</span>
            <input
              name="firstName"
              defaultValue={profile.firstName}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted-foreground">{t("lastName")}</span>
            <input
              name="lastName"
              defaultValue={profile.lastName}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted-foreground">{t("email")}</span>
            <input
              name="email"
              type="email"
              defaultValue={profile.email}
              disabled={signedIn}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary disabled:opacity-60"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted-foreground">{t("phone")}</span>
            <input
              name="phone"
              defaultValue={profile.phone}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted-foreground">{t("city")}</span>
            <input
              name="city"
              defaultValue={profile.city}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted-foreground">{t("telegram")}</span>
            <input
              name="telegramUsername"
              defaultValue={profile.telegramUsername}
              placeholder="@username"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted-foreground">{t("birthDate")}</span>
            <input
              name="birthDate"
              type="date"
              defaultValue={profile.birthDate}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-primary"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block text-muted-foreground">{t("note")}</span>
            <textarea
              name="note"
              rows={3}
              defaultValue={profile.note}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
            />
          </label>

          {error ? <p className="text-sm text-danger sm:col-span-2">{error}</p> : null}
          {saved ? <p className="text-sm text-success sm:col-span-2">{t("profileSaved")}</p> : null}

          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? t("saving") : t("saveProfile")}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-display text-xl font-semibold">{t("listsTitle")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("listsLead")}</p>
          </div>
          <Button href="/wishlist" variant="secondary" size="sm">
            {t("manageLists")}
          </Button>
        </div>

        {lists.length === 0 ? (
          <p className="mt-5 text-sm text-muted-foreground">{t("listsEmpty")}</p>
        ) : (
          <ul className="mt-5 space-y-2">
            {lists.map((list) => (
              <li key={list.id}>
                <Link
                  href={`/wishlist?list=${list.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 transition hover:border-primary"
                >
                  <span className="font-medium">
                    {list.name}
                    {list.isDefault ? (
                      <span className="ml-2 text-xs text-muted-foreground">{t("defaultList")}</span>
                    ) : null}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {t("listCount", { count: list.itemCount })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-display text-xl font-semibold">{t("shortcutsTitle")}</h2>
        <ul className="mt-4 space-y-3">
          {[
            { href: "/account/orders", label: tPages("orders"), hint: t("ordersHint") },
            { href: "/account/addresses", label: tPages("addresses"), hint: t("addressesHint") },
            { href: "/track-order", label: tPages("trackOrder"), hint: t("trackHint") },
            { href: "/wishlist", label: tPages("wishlist"), hint: t("wishlistHint") },
            { href: "/contacts", label: tPages("contacts"), hint: t("contactsHint") },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition hover:border-primary"
              >
                <p className="font-semibold">{item.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.hint}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
