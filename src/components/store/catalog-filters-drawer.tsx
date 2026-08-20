"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";

export function CatalogFiltersDrawer({
  label,
  closeLabel,
  children,
}: {
  label: string;
  closeLabel: string;
  children: React.ReactNode;
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
    <>
      <button
        type="button"
        className="inline-flex h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold shadow-[var(--shadow-card)] transition hover:border-primary"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal className="size-4 text-primary" />
        {label}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            aria-label={closeLabel}
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[1.75rem] border border-border bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" aria-hidden />
            <div className="mb-5 flex items-center justify-between">
              <p className="text-display text-xl font-semibold">{label}</p>
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-full border border-border"
                aria-label={closeLabel}
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            <div onClick={() => setOpen(false)}>{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
