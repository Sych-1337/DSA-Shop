"use client";

import { useRouter } from "@/i18n/navigation";

type SortOption = { value: string; label: string; href: string };

export function CatalogSortSelect({
  label,
  options,
  current,
}: {
  label: string;
  options: SortOption[];
  current: string;
}) {
  const router = useRouter();

  return (
    <label className="flex w-full min-w-0 flex-col gap-1 sm:hidden">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm font-medium"
        value={current}
        onChange={(event) => {
          const next = options.find((option) => option.value === event.target.value);
          if (next) router.push(next.href);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
