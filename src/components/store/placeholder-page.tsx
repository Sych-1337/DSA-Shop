import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export async function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const t = await getTranslations("blog");
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-display text-4xl font-semibold">{title}</h1>
      <p className="mt-3 text-muted-foreground">{description}</p>
      <Link href="/" className="mt-8 inline-flex font-semibold text-primary hover:underline">
        ← {t("home")}
      </Link>
    </main>
  );
}
