import type { Metadata } from "next";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";

import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { AdminSignOut } from "@/components/admin/admin-sign-out";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { ADMIN_NAV_GROUPS } from "@/lib/admin/nav";
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

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isPublicAdminSurface =
    pathname === "/admin/login" || pathname.startsWith("/admin/login/") || pathname === "/admin/forbidden";

  if (isPublicAdminSurface) {
    return <div className="min-h-dvh bg-background">{children}</div>;
  }

  const staff = await requireStaff(pathname || "/admin");

  const visibleGroups = ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      const permission = ADMIN_NAV_PERMISSION[item.href];
      return permission == null || staffHasPermission(staff, permission);
    }),
  })).filter((group) => group.items.length > 0);

  const staffLabel = `${staff.name} · ${staff.roleKeys.slice(0, 2).join(", ") || "staff"}`;

  return (
    <NextIntlClientProvider locale={defaultLocale} messages={messages}>
      <div className="flex min-h-dvh bg-background">
        <aside className="hidden w-56 shrink-0 border-r border-border bg-chrome text-chrome-foreground lg:flex lg:flex-col xl:w-60">
          <div className="border-b border-white/10 px-4 py-4">
            <p className="text-display text-base font-semibold">D&A Admin</p>
            <p className="mt-0.5 truncate text-[11px] text-chrome-foreground/55">{staffLabel}</p>
          </div>
          <AdminSidebarNav groups={visibleGroups} />
          <div className="space-y-2 border-t border-white/10 p-3">
            <ThemeToggle />
            <AdminSignOut />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 py-2.5 backdrop-blur pt-[max(0.65rem,env(safe-area-inset-top))] lg:hidden">
            <div className="flex min-w-0 items-center gap-2.5">
              <AdminMobileNav groups={visibleGroups} staffLabel={staffLabel} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Admin</p>
                <p className="truncate text-[11px] text-muted-foreground">{staffLabel}</p>
              </div>
            </div>
            <ThemeToggle className="text-foreground hover:bg-surface-muted" />
          </header>
          <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-5 md:px-6 md:py-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </NextIntlClientProvider>
  );
}
