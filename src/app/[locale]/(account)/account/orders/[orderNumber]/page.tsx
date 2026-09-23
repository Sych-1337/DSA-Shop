import { notFound, redirect } from "next/navigation";

import { getSession } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";
import { createOrderAccessToken } from "@/lib/security/order-access";

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string; locale: string }>;
}) {
  const { orderNumber, locale } = await params;
  const session = await getSession();
  if (!session?.user?.email) {
    redirect(`/${locale}/account`);
  }

  const order = await prisma.order.findFirst({
    where: {
      orderNumber: { equals: orderNumber, mode: "insensitive" },
      customerEmail: { equals: session.user.email, mode: "insensitive" },
    },
    select: { orderNumber: true, customerEmail: true },
  });
  if (!order) notFound();

  const token = createOrderAccessToken(order.orderNumber, order.customerEmail);
  redirect(
    `/${locale}/track-order?order=${encodeURIComponent(order.orderNumber)}&email=${encodeURIComponent(order.customerEmail)}&token=${encodeURIComponent(token)}`,
  );
}
