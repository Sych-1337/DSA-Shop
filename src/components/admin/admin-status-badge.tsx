import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  neutral: "border-border bg-surface-muted text-foreground",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200",
  warning: "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-200",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  danger: "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200",
};

export function AdminStatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONE;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
