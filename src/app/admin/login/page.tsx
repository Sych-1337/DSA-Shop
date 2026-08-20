import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/login-form";
import { getStaffContext, isAdminAuthBypassEnabled } from "@/lib/auth/rbac";

export const metadata: Metadata = {
  title: "Вхід",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (isAdminAuthBypassEnabled()) {
    redirect("/admin");
  }
  const staff = await getStaffContext();
  if (staff) redirect("/admin");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-[var(--shadow-card)]">
        <p className="text-display text-center text-3xl font-semibold">D&A Admin</p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Вхід лише для staff з активним профілем.
        </p>
        <div className="mt-8">
          <Suspense fallback={<p className="text-center text-sm">Завантаження…</p>}>
            <AdminLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
