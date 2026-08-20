import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";

import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import {
  ADMIN_NAV_PERMISSION,
  requireStaff,
  staffHasPermission,
} from "@/lib/auth/rbac";
import { defaultLocale } from "@/i18n/config";
import messages from "../../../messages/uk.json";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/sales", label: "Sales" },
  { href: "/admin/orders", label: "Замовлення" },
  { href: "/admin/returns", label: "Повернення" },
  { href: "/admin/payments", label: "Платежі" },
  { href: "/admin/emails", label: "Листи" },
  { href: "/admin/notifications", label: "Сповіщення" },
  { href: "/admin/shipments", label: "Доставка" },
  { href: "/admin/customers", label: "Клієнти" },
  { href: "/admin/products", label: "Товари" },
  { href: "/admin/reviews", label: "Відгуки" },
  { href: "/admin/back-in-stock", label: "Наявність" },
  { href: "/admin/coupons", label: "Промокоди" },
  { href: "/admin/inventory", label: "Склад" },
  { href: "/admin/content", label: "Контент" },
  { href: "/admin/seo", label: "SEO" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/commissions", label: "Комісія" },
  { href: "/admin/settings", label: "Налаштування" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isPublicAdminSurface =
    pathname === "/admin/login" || pathname.startsWith("/admin/login/") || pathname === "/admin/forbidden";

  if (isPublicAdminSurface) {
    return <div className="min-h-dvh bg-background">{children}</div>;
  }

  const staff = await requireStaff(pathname || "/admin");

  const visibleNav = NAV.filter((item) => {
    const permission = ADMIN_NAV_PERMISSION[item.href];
    return permission == null || staffHasPermission(staff, permission);
  });

  const staffLabel = `${staff.name} · ${staff.roleKeys.slice(0, 2).join(", ") || "staff"}`;

  return (
    <NextIntlClientProvider locale={defaultLocale} messages={messages}>
      <div className="flex min-h-dvh bg-background">
        <aside className="hidden w-60 shrink-0 border-r border-border bg-chrome text-chrome-foreground md:flex md:flex-col">
          <div className="border-b border-white/10 px-4 py-5">
            <p className="text-display text-lg font-semibold">D&A Admin</p>
            <p className="text-xs text-chrome-foreground/55">{staffLabel}</p>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Admin">
            {visibleNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-chrome-foreground/80 hover:bg-white/10 hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-white/10 p-3">
            <ThemeToggle />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
            <div className="flex min-w-0 items-center gap-3">
              <AdminMobileNav items={visibleNav} staffLabel={staffLabel} />
              <p className="truncate font-semibold">Admin</p>
            </div>
            <ThemeToggle className="text-foreground hover:bg-surface-muted" />
          </header>
          <nav
            className="flex gap-2 overflow-x-auto border-b border-border bg-surface px-4 py-2 md:hidden"
            aria-label="Швидка навігація"
          >
            {visibleNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-medium whitespace-nowrap hover:border-primary hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <main id="main" className="flex-1 p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
