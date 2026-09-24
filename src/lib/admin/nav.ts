export type AdminNavItem = {
  href: string;
  label: string;
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

/** Grouped sidebar — ops first, then catalog / CRM / content / system. */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    id: "ops",
    label: "Операції",
    items: [
      { href: "/admin", label: "Огляд" },
      { href: "/admin/sales", label: "Sales" },
      { href: "/admin/orders", label: "Замовлення" },
      { href: "/admin/returns", label: "Повернення" },
      { href: "/admin/payments", label: "Платежі" },
      { href: "/admin/shipments", label: "Доставка" },
    ],
  },
  {
    id: "catalog",
    label: "Каталог",
    items: [
      { href: "/admin/products", label: "Товари" },
      { href: "/admin/inventory", label: "Склад" },
      { href: "/admin/reviews", label: "Відгуки" },
      { href: "/admin/back-in-stock", label: "Наявність" },
      { href: "/admin/coupons", label: "Промокоди" },
    ],
  },
  {
    id: "crm",
    label: "Клієнти",
    items: [
      { href: "/admin/customers", label: "Клієнти" },
      { href: "/admin/emails", label: "Листи" },
      { href: "/admin/notifications", label: "Сповіщення" },
    ],
  },
  {
    id: "content",
    label: "Контент",
    items: [
      { href: "/admin/content", label: "Контент" },
      { href: "/admin/seo", label: "SEO" },
    ],
  },
  {
    id: "system",
    label: "Система",
    items: [
      { href: "/admin/analytics", label: "Аналітика" },
      { href: "/admin/commissions", label: "Комісія" },
      { href: "/admin/staff", label: "Команда" },
      { href: "/admin/settings", label: "Налаштування" },
    ],
  },
];

export function flattenAdminNav(groups: AdminNavGroup[]): AdminNavItem[] {
  return groups.flatMap((group) => group.items);
}

export function isAdminNavActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
