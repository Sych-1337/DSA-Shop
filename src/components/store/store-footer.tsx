import { getLocale, getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export async function StoreFooter({
  storeName,
  tagline = "Dreams & Anime",
}: {
  storeName: string;
  tagline?: string;
}) {
  const t = await getTranslations("footer");
  const locale = await getLocale();
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t("buyers"),
      links: [
        { href: "/delivery-payment", label: t("delivery") },
        { href: "/returns", label: t("returns") },
        { href: "/faq", label: t("faq") },
        { href: "/track-order", label: t("trackOrder") },
      ],
    },
    {
      title: t("catalog"),
      links: [
        { href: "/catalog", label: t("allProducts") },
        { href: "/catalog/figures", label: t("figures") },
        { href: "/catalog/cosplay", label: t("cosplay") },
        { href: "/catalog/manga", label: t("manga") },
      ],
    },
    {
      title: t("info"),
      links: [
        { href: "/about", label: t("about") },
        { href: "/contacts", label: t("contacts") },
        { href: "/privacy", label: t("privacy") },
        { href: "/public-offer", label: t("offer") },
      ],
    },
  ];

  return (
    <footer className="mt-auto border-t border-white/10 bg-chrome text-chrome-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-[1.2fr_2fr] lg:grid-cols-[1.1fr_2fr_1fr]">
        <div>
          <p className="text-display text-2xl font-semibold">{storeName}</p>
          <p className="mt-1 text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            {tagline}
          </p>
          <p className="mt-3 max-w-sm text-sm text-chrome-foreground/65">{t("blurb")}</p>
          <div className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-sm text-chrome-foreground/70">
            <span>Instagram</span>
            <span>Telegram</span>
            <span>TikTok</span>
            <span>YouTube</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="mb-3 text-sm font-semibold tracking-wide text-primary">{column.title}</p>
              <ul className="space-y-2 text-sm text-chrome-foreground/75">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-primary/30 bg-white/5 p-5 dark:shadow-[var(--shadow-glow)]">
          <p className="text-display text-lg font-semibold">{t("newsletter")}</p>
          <p className="mt-2 text-sm text-chrome-foreground/65">{t("newsletterHint")}</p>
          <p className="mt-4 text-sm">
            <Link href="/contacts" className="font-medium text-primary hover:underline">
              {t("subscribe")} →
            </Link>
          </p>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-chrome-foreground/50 sm:text-left">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {storeName}. {t("rights")}
          </p>
          <p>
            <Link href="/terms" className="hover:text-primary">
              {t("terms")}
            </Link>
            {" · "}
            <Link href="/privacy" className="hover:text-primary">
              {t("privacy")}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
