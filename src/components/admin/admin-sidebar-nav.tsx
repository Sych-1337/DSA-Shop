"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { AdminNavGroup } from "@/lib/admin/nav";
import { isAdminNavActive } from "@/lib/admin/nav";
import { cn } from "@/lib/utils";

export function AdminSidebarNav({ groups }: { groups: AdminNavGroup[] }) {
  const pathname = usePathname() || "/admin";

  return (
    <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3" aria-label="Admin">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-[0.14em] text-chrome-foreground/40 uppercase">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isAdminNavActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-chrome-foreground/75 hover:bg-white/10 hover:text-chrome-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
