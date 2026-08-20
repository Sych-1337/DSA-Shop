import { redirect } from "next/navigation";

export default async function AccountWishlistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/wishlist`);
}
