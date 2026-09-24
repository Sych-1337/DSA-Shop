import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AdminTable({
  children,
  minWidth = "720px",
  className,
}: {
  children: ReactNode;
  minWidth?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border border-border bg-surface shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function AdminTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-border bg-surface-muted/80 text-[11px] tracking-wide text-muted-foreground uppercase">
      {children}
    </thead>
  );
}

export function AdminTh({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <th className={cn("px-3 py-2.5 font-medium", className)}>{children}</th>;
}

export function AdminTd({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return <td className={cn("px-3 py-2.5 align-middle", className)}>{children}</td>;
}

export function AdminEmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-10 text-center text-sm text-muted-foreground">
        {children}
      </td>
    </tr>
  );
}
