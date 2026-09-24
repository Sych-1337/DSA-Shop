import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AdminFilterChip = {
  href: string;
  label: string;
  active?: boolean;
  count?: number;
};

export function AdminFilterChips({ chips }: { chips: AdminFilterChip[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <Link
          key={chip.href + chip.label}
          href={chip.href}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition",
            chip.active
              ? "border-primary bg-primary text-white"
              : "border-border bg-surface text-muted-foreground hover:border-primary/50 hover:text-foreground",
          )}
        >
          {chip.label}
          {typeof chip.count === "number" ? (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] tabular-nums",
                chip.active ? "bg-white/20" : "bg-surface-muted",
              )}
            >
              {chip.count}
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

export function AdminFilterBar({
  chips,
  children,
  className,
}: {
  chips?: AdminFilterChip[];
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "space-y-3 rounded-xl border border-border bg-surface p-3 shadow-[var(--shadow-card)] sm:p-4",
        className,
      )}
    >
      {chips && chips.length > 0 ? <AdminFilterChips chips={chips} /> : null}
      {children ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function adminFilterInputClassName(extra?: string) {
  return cn(
    "h-9 min-w-0 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary sm:min-w-[12rem]",
    extra,
  );
}

export function adminFilterSelectClassName(extra?: string) {
  return cn(
    "h-9 rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-primary",
    extra,
  );
}
