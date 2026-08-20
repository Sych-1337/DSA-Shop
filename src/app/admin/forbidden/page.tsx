import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Немає доступу",
  robots: { index: false, follow: false },
};

export default function AdminForbiddenPage() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-display text-3xl font-semibold">403 — Немає доступу</h1>
      <p className="mt-3 text-muted-foreground">
        У вашої ролі немає дозволу на цю дію. Зверніться до власника магазину.
      </p>
      <Link href="/admin" className="mt-6 inline-block text-primary hover:underline">
        На dashboard
      </Link>
    </div>
  );
}
