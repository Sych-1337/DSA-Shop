"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminSignOut } from "@/components/admin/admin-sign-out";

type NavItem = { href: string; label: string };

export function AdminMobileNav({
  items,
  staffLabel,
}: {
  items: NavItem[];
  staffLabel: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-surface-muted text-foreground"
        aria-expanded={open}
        aria-label="Меню адмінки"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Закрити меню"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(100%,18rem)] flex-col bg-chrome text-chrome-foreground shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div>
                <p className="text-display text-lg font-semibold">D&A Admin</p>
                <p className="text-xs text-chrome-foreground/55">{staffLabel}</p>
              </div>
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-full hover:bg-white/10"
                aria-label="Закрити"
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Admin">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-chrome-foreground/85 hover:bg-white/10 hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-white/10 p-3">
              <AdminSignOut />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
