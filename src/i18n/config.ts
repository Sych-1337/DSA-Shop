export const locales = ["uk", "en", "ru"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "uk";

export const localeLabels: Record<AppLocale, string> = {
  uk: "UA",
  en: "EN",
  ru: "RU",
};

export const localeHtmlLang: Record<AppLocale, string> = {
  uk: "uk",
  en: "en",
  ru: "ru",
};

export function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}
