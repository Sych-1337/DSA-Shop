import type { FaqItem } from "@/content/info-pages";

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]">
      {items.map((item) => (
        <details key={item.question} className="group px-4 py-1 sm:px-5">
          <summary className="cursor-pointer list-none py-4 font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-start justify-between gap-4">
              <span>{item.question}</span>
              <span
                aria-hidden
                className="mt-0.5 shrink-0 text-primary transition group-open:rotate-45"
              >
                +
              </span>
            </span>
          </summary>
          <p className="pb-4 leading-relaxed text-muted-foreground">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
