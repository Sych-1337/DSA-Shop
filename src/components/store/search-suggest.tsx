"use client";

import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, useTransition } from "react";

import { Link, useRouter } from "@/i18n/navigation";
import { formatMoney } from "@/lib/money";

type SuggestItem = {
  id: string;
  slug: string;
  title: string;
  priceAmount: number;
  imageUrl: string | null;
  fandomName: string | null;
};

export function SearchSuggest({
  className,
  inputClassName,
  placeholder,
  ariaLabel,
  submitLabel,
  compact = false,
}: {
  className?: string;
  inputClassName?: string;
  placeholder: string;
  ariaLabel: string;
  submitLabel: string;
  compact?: boolean;
}) {
  const t = useTranslations("catalog");
  const locale = useLocale();
  const router = useRouter();
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SuggestItem[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (query.trim().length < 2) {
      setItems([]);
      return;
    }
    const handle = window.setTimeout(() => {
      startTransition(async () => {
        try {
          const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query.trim())}`);
          if (!res.ok) return;
          const data = (await res.json()) as { items: SuggestItem[] };
          setItems(data.items ?? []);
          setOpen(true);
        } catch {
          /* ignore */
        }
      });
    }, 220);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className={className ?? "relative min-w-0 flex-1"}>
      <form
        action={`/${locale}/search`}
        className="relative"
        onSubmit={() => setOpen(false)}
      >
        <label htmlFor={inputId} className="sr-only">
          {ariaLabel}
        </label>
        <input
          id={inputId}
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => items.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={
            inputClassName ??
            "h-11 w-full rounded-full border border-white/10 bg-white/5 px-4 pr-11 text-sm text-chrome-foreground placeholder:text-chrome-foreground/40 focus:border-primary focus:outline-none"
          }
        />
        <button
          type="submit"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-2 text-primary"
          aria-label={submitLabel}
        >
          <Search className="size-4" />
        </button>
      </form>

      {open && query.trim().length >= 2 ? (
        <div
          className={`absolute top-[calc(100%+0.4rem)] z-50 w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)] ${
            compact ? "max-h-80" : ""
          }`}
        >
          {items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">{t("suggestEmpty")}</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/product/${item.slug}`}
                    className="flex items-center gap-3 px-3 py-2 transition hover:bg-surface-muted"
                    onClick={() => setOpen(false)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl ?? "/api/placeholder?title=D%26A&hue=320"}
                      alt=""
                      className="size-11 shrink-0 rounded-lg object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      {item.fandomName ? (
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {item.fandomName}
                        </span>
                      ) : null}
                      <span className="block truncate text-sm font-medium">{item.title}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-primary">
                      {formatMoney(item.priceAmount)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="w-full border-t border-border px-4 py-2.5 text-left text-sm font-medium text-primary hover:bg-surface-muted"
            onClick={() => {
              setOpen(false);
              router.push(`/search?q=${encodeURIComponent(query.trim())}`);
            }}
          >
            {t("suggestAll", { query: query.trim() })}
          </button>
        </div>
      ) : null}
    </div>
  );
}
