"use client";

import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type TaxonomyOption = { id: string; name: string };

export type TaxonomyValue =
  | { mode: "existing"; id: string; name: string }
  | { mode: "new"; name: string }
  | { mode: "none" };

export function CreatableTaxonomyField({
  label,
  options,
  value,
  onChange,
  placeholder = "Обрати…",
  createLabel = "Додати",
  tone = "default",
}: {
  label: string;
  options: TaxonomyOption[];
  value: TaxonomyValue;
  onChange: (value: TaxonomyValue) => void;
  placeholder?: string;
  createLabel?: string;
  tone?: "default" | "primary";
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedLabel =
    value.mode === "existing" || value.mode === "new" ? value.name : "";

  useEffect(() => {
    if (!open) setQuery(selectedLabel);
  }, [open, selectedLabel]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((item) => item.name.toLowerCase().includes(q));
  }, [options, query]);

  const canCreate =
    query.trim().length >= 2 &&
    !options.some((item) => item.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <div ref={rootRef} className="relative min-w-0">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-11 w-full items-center gap-2 rounded-xl border bg-surface px-3 text-left text-sm transition",
          tone === "primary" && value.mode !== "none"
            ? "border-primary/50 text-primary"
            : "border-border text-foreground",
          open && "border-primary",
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", value.mode === "none" && "text-muted-foreground")}>
          {value.mode === "none" ? placeholder : value.name}
          {value.mode === "new" ? (
            <span className="ml-1 text-[10px] font-semibold uppercase text-primary">new</span>
          ) : null}
        </span>
        {value.mode !== "none" ? (
          <span
            role="button"
            tabIndex={0}
            className="rounded-md p-1 text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onChange({ mode: "none" });
              setQuery("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onChange({ mode: "none" });
              }
            }}
          >
            <X className="size-3.5" />
          </span>
        ) : null}
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </button>

      {open ? (
        <div
          id={listId}
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-card)]"
        >
          <div className="border-b border-border p-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Пошук або нова назва…"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto p-1">
            {filtered.map((item) => {
              const active = value.mode === "existing" && value.id === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-muted",
                      active && "bg-primary/10 font-semibold text-primary",
                    )}
                    onClick={() => {
                      onChange({ mode: "existing", id: item.id, name: item.name });
                      setOpen(false);
                    }}
                  >
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    {active ? <Check className="size-4 shrink-0" /> : null}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && !canCreate ? (
              <li className="px-3 py-3 text-sm text-muted-foreground">Нічого не знайдено</li>
            ) : null}
            {canCreate ? (
              <li>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-primary hover:bg-primary/10"
                  onClick={() => {
                    onChange({ mode: "new", name: query.trim() });
                    setOpen(false);
                  }}
                >
                  <Plus className="size-4 shrink-0" />
                  {createLabel} «{query.trim()}»
                </button>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
