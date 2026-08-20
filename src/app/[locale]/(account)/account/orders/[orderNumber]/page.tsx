import { redirect } from "next/navigation";

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string; locale: string }>;
}) {
  const { orderNumber, locale } = await params;
  redirect(`/${locale}/track-order?order=${encodeURIComponent(orderNumber)}`);
}
