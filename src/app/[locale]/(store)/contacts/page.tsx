import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { ContactForm } from "@/components/store/contact-form";
import { STORE_CONTACTS } from "@/content/info-pages";
import { buildEntityMetadata } from "@/features/seo/service";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages");
  const tContact = await getTranslations("contact");
  return buildEntityMetadata({
    entityType: "page",
    entityId: "contacts",
    fallbackTitle: t("contacts"),
    fallbackDescription: tContact("lead"),
    fallbackPath: "/contacts",
  });
}

export default async function ContactsPage() {
  const t = await getTranslations("pages");
  const tContact = await getTranslations("contact");
  const locale = await getLocale();
  const hours =
    locale === "en"
      ? STORE_CONTACTS.hoursEn
      : locale === "ru"
        ? STORE_CONTACTS.hoursRu
        : STORE_CONTACTS.hoursUk;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
      <h1 className="text-display text-3xl font-semibold sm:text-4xl">{t("contacts")}</h1>
      <p className="mt-3 text-muted-foreground sm:text-lg">{tContact("lead")}</p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <dt className="text-sm text-muted-foreground">{tContact("email")}</dt>
          <dd className="mt-1 font-semibold">
            <a href={`mailto:${STORE_CONTACTS.email}`} className="hover:text-primary">
              {STORE_CONTACTS.email}
            </a>
          </dd>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <dt className="text-sm text-muted-foreground">{tContact("phone")}</dt>
          <dd className="mt-1 font-semibold">
            <a href={`tel:${STORE_CONTACTS.phone.replace(/\s/g, "")}`} className="hover:text-primary">
              {STORE_CONTACTS.phone}
            </a>
          </dd>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <dt className="text-sm text-muted-foreground">{tContact("hours")}</dt>
          <dd className="mt-1 font-semibold">{hours}</dd>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <dt className="text-sm text-muted-foreground">{tContact("social")}</dt>
          <dd className="mt-2 flex flex-wrap gap-3 text-sm font-semibold">
            <a href={STORE_CONTACTS.telegram} className="text-primary hover:underline" target="_blank" rel="noreferrer">
              Telegram
            </a>
            <a href={STORE_CONTACTS.instagram} className="text-primary hover:underline" target="_blank" rel="noreferrer">
              Instagram
            </a>
          </dd>
        </div>
      </dl>

      <h2 className="text-display mt-12 text-xl font-semibold sm:text-2xl">{tContact("formTitle")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{tContact("formHint")}</p>
      <ContactForm />
    </main>
  );
}
