"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

export function SoftImage({
  src,
  fallback,
  alt = "",
  className,
}: {
  src: string;
  fallback: string;
  alt?: string;
  className?: string;
}) {
  const [current, setCurrent] = useState(src);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      className={cn(className)}
      onError={() => {
        if (current !== fallback) setCurrent(fallback);
      }}
    />
  );
}
