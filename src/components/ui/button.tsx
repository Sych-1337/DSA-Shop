import { cva, type VariantProps } from "class-variance-authority";
import NextLink from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { Link as LocaleLink } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white shadow-[var(--shadow-glow)] hover:bg-primary-hover dark:shadow-[var(--shadow-glow)]",
        secondary:
          "bg-surface-muted text-foreground hover:bg-primary-soft border border-border",
        ghost: "bg-transparent text-inherit hover:bg-white/10",
        outline:
          "border border-border bg-surface text-foreground hover:border-primary hover:text-primary",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    href?: string;
    children: ReactNode;
  };

function isAppRoute(href: string) {
  return (
    href.startsWith("/admin") ||
    href.startsWith("/api") ||
    href.startsWith("/webhooks") ||
    href.startsWith("http")
  );
}

export function Button({ className, variant, size, href, children, ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  if (href) {
    if (isAppRoute(href)) {
      return (
        <NextLink href={href} className={classes}>
          {children}
        </NextLink>
      );
    }
    return (
      <LocaleLink href={href} className={classes}>
        {children}
      </LocaleLink>
    );
  }
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  );
}
