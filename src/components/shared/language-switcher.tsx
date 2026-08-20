"use client";

import { useLocale, useTranslations } from "next-intl";

import { localeLabels, type AppLocale } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      className={cn("flex items-center gap-0.5 rounded-full border border-white/10 p-0.5", className)}
      role="group"
      aria-label={t("language")}
    >
      {(Object.keys(localeLabels) as AppLocale[]).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => router.replace(pathname, { locale: code })}
          className={cn(
            "rounded-full px-2 py-1 text-[11px] font-semibold tracking-wide transition",
            code === locale
              ? "bg-primary text-white"
              : "text-chrome-foreground/70 hover:bg-white/10 hover:text-primary",
          )}
          aria-pressed={code === locale}
        >
          {localeLabels[code]}
        </button>
      ))}
    </div>
  );
}
