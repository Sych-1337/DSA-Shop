import { prisma } from "@/lib/db/prisma";

export async function listAdminCustomers(q?: string) {
  const query = q?.trim();
  const profiles = await prisma.customerProfile.findMany({
    where: query
      ? {
          OR: [
            { contactEmail: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { telegramUsername: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    take: 80,
    include: {
      addresses: { select: { id: true }, take: 1 },
      _count: { select: { addresses: true, reviews: true } },
    },
  });

  const contacts = profiles
    .map((row) => ({
      email: row.contactEmail?.toLowerCase() ?? null,
      phone: row.phone ?? null,
    }))
    .filter((row) => row.email || row.phone);

  const orders =
    contacts.length === 0
      ? []
      : await prisma.order.findMany({
          where: {
            OR: contacts.flatMap((row) => [
              ...(row.email
                ? [{ customerEmail: { equals: row.email, mode: "insensitive" as const } }]
                : []),
              ...(row.phone ? [{ customerPhone: row.phone }] : []),
            ]),
          },
          select: {
            id: true,
            customerEmail: true,
            customerPhone: true,
            totalAmount: true,
            createdAt: true,
          },
        });

  return profiles.map((profile) => {
    const email = profile.contactEmail?.toLowerCase() ?? null;
    const phone = profile.phone ?? null;
    const related = orders.filter(
      (order) =>
        (email && order.customerEmail.toLowerCase() === email) ||
        (phone && order.customerPhone === phone),
    );
    const spent = related.reduce((sum, order) => sum + order.totalAmount, 0);
    return {
      ...profile,
      orderCount: related.length,
      totalSpent: spent,
      lastOrderAt: related[0]
        ? related.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]!.createdAt
        : null,
    };
  });
}

export async function getAdminCustomer(id: string) {
  const profile = await prisma.customerProfile.findUnique({
    where: { id },
    include: {
      addresses: { orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }] },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { product: { select: { title: true, slug: true } } },
      },
    },
  });
  if (!profile) return null;

  const email = profile.contactEmail?.toLowerCase() ?? null;
  const phone = profile.phone ?? null;
  const orders =
    !email && !phone
      ? []
      : await prisma.order.findMany({
          where: {
            OR: [
              ...(email
                ? [{ customerEmail: { equals: email, mode: "insensitive" as const } }]
                : []),
              ...(phone ? [{ customerPhone: phone }] : []),
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 40,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            totalAmount: true,
            createdAt: true,
          },
        });

  return { profile, orders };
}

export async function listAdminNotifications() {
  const [newOrders, failedPayments, openReturns] = await Promise.all([
    prisma.order.findMany({
      where: { status: "NEW", paymentStatus: { in: ["PENDING", "FAILED"] } },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        orderNumber: true,
        customerEmail: true,
        totalAmount: true,
        paymentStatus: true,
        createdAt: true,
      },
    }),
    prisma.payment.findMany({
      where: { status: "FAILED" },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        order: { select: { id: true, orderNumber: true, customerEmail: true } },
      },
    }),
    prisma.returnRequest.findMany({
      where: { status: { in: ["REQUESTED", "APPROVED", "RECEIVED"] } },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        status: true,
        createdAt: true,
        order: { select: { id: true, orderNumber: true, customerEmail: true } },
      },
    }),
  ]);

  type Item = {
    id: string;
    kind: "order" | "payment" | "return";
    title: string;
    href: string;
    meta: string;
    createdAt: Date;
  };

  const items: Item[] = [
    ...newOrders.map((order) => ({
      id: `order-${order.id}`,
      kind: "order" as const,
      title: `Нове замовлення ${order.orderNumber}`,
      href: `/admin/orders/${order.id}`,
      meta: `${order.customerEmail} · ${order.paymentStatus}`,
      createdAt: order.createdAt,
    })),
    ...failedPayments.map((payment) => ({
      id: `pay-${payment.id}`,
      kind: "payment" as const,
      title: `Невдала оплата ${payment.order.orderNumber}`,
      href: `/admin/orders/${payment.order.id}`,
      meta: payment.order.customerEmail,
      createdAt: payment.createdAt,
    })),
    ...openReturns.map((row) => ({
      id: `ret-${row.id}`,
      kind: "return" as const,
      title: `Повернення ${row.order.orderNumber}`,
      href: `/admin/returns`,
      meta: `${row.order.customerEmail} · ${row.status}`,
      createdAt: row.createdAt,
    })),
  ];

  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 40);
}
