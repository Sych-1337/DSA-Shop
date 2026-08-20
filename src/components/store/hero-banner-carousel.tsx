"use client";

import { useEffect, useState } from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type BannerSlide = {
  imageUrl: string;
  imageAlt?: string;
  href?: string;
};

export function HeroBannerCarousel({
  slides,
  autoplayMs = 6500,
  className,
}: {
  slides: BannerSlide[];
  autoplayMs?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const safeSlides = slides.filter((s) => s.imageUrl);
  const count = safeSlides.length;

  useEffect(() => {
    if (count <= 1) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, autoplayMs);
    return () => window.clearInterval(id);
  }, [autoplayMs, count]);

  if (count === 0) return null;

  const active = safeSlides[index] ?? safeSlides[0];

  return (
    <div className={cn("pointer-events-none absolute inset-0", className)}>
      {safeSlides.map((slide, i) => {
        const image = (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slide.imageUrl}
            alt={slide.imageAlt ?? ""}
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-700",
              i === index ? "opacity-100" : "opacity-0",
            )}
          />
        );
        if (slide.href) {
          return (
            <Link
              key={slide.imageUrl}
              href={slide.href}
              className="pointer-events-auto absolute inset-0"
              aria-hidden={i !== index}
              tabIndex={i === index ? 0 : -1}
              style={{ zIndex: i === index ? 1 : 0 }}
            >
              {image}
            </Link>
          );
        }
        return (
          <div key={slide.imageUrl} className="absolute inset-0" aria-hidden={i !== index}>
            {image}
          </div>
        );
      })}

      {count > 1 ? (
        <div className="pointer-events-auto absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-8 sm:left-auto sm:right-8 sm:translate-x-0">
          {safeSlides.map((slide, i) => (
            <button
              key={`dot-${slide.imageUrl}`}
              type="button"
              aria-label={`Slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={cn(
                "h-2.5 rounded-full transition",
                i === index ? "w-8 bg-primary" : "w-2.5 bg-white/45 hover:bg-white/70",
              )}
            />
          ))}
        </div>
      ) : null}

      <span className="sr-only">{active.imageAlt}</span>
    </div>
  );
}
