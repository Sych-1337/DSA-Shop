import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { AccountCabinet } from "@/components/store/account-cabinet";
import { getCustomerAccount } from "@/features/account/service";
import { buildEntityMetadata } from "@/features/seo/service";
import { listWishlists } from "@/features/wishlist/service";
import { isSocialAuthConfigured } from "@/lib/auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages");
  return buildEntityMetadata({
    entityType: "page",
    entityId: "account",
    fallbackTitle: t("account"),
    fallbackDescription: t("account"),
    fallbackPath: "/account",
    forceNoindex: true,
  });
}

function formatBirthDate(value: Date | null | undefined) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

export default async function AccountPage() {
  const t = await getTranslations("pages");
  const tAccount = await getTranslations("account");
  const [{ sessionUser, profile }, lists] = await Promise.all([
    getCustomerAccount(),
    listWishlists(),
  ]);

  const profileView = {
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    phone: profile?.phone ?? "",
    city: profile?.city ?? "",
    telegramUsername: profile?.telegramUsername
      ? `@${profile.telegramUsername}`
      : "",
    birthDate: formatBirthDate(profile?.birthDate),
    note: profile?.note ?? "",
    email: sessionUser?.email ?? profile?.contactEmail ?? "",
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
      <h1 className="text-display text-3xl font-semibold sm:text-4xl">{t("account")}</h1>
      <p className="mt-3 text-muted-foreground sm:text-lg">{tAccount("lead")}</p>

      <AccountCabinet
        profile={profileView}
        lists={lists}
        signedIn={Boolean(sessionUser)}
        social={{
          google: isSocialAuthConfigured("google"),
          apple: isSocialAuthConfigured("apple"),
        }}
      />
    </main>
  );
}
