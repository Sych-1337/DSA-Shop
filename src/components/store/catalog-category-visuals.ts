import {
  Box,
  Gift,
  KeyRound,
  LayoutGrid,
  Shirt,
  Sparkles,
  Sticker,
  BookOpen,
  Tag,
  type LucideIcon,
} from "lucide-react";

/** Visual accents for known catalog category slugs */
export const CATEGORY_VISUALS: Record<
  string,
  { icon: LucideIcon; hue: string }
> = {
  figures: { icon: Sparkles, hue: "320" },
  figurines: { icon: Sparkles, hue: "320" },
  cosplay: { icon: Shirt, hue: "280" },
  manga: { icon: BookOpen, hue: "210" },
  clothing: { icon: Shirt, hue: "350" },
  apparel: { icon: Shirt, hue: "350" },
  posters: { icon: LayoutGrid, hue: "25" },
  stickers: { icon: Sticker, hue: "145" },
  "stickers-decals": { icon: Sticker, hue: "145" },
  keychains: { icon: KeyRound, hue: "45" },
  "soft-toys": { icon: Gift, hue: "330" },
  plush: { icon: Gift, hue: "330" },
  accessories: { icon: Box, hue: "190" },
  gifts: { icon: Gift, hue: "300" },
};

export function categoryVisual(slug: string) {
  return (
    CATEGORY_VISUALS[slug] ?? {
      icon: Tag,
      hue: String((slug.split("").reduce((n, c) => n + c.charCodeAt(0), 0) % 280) + 20),
    }
  );
}

export function categoryPlaceholder(slug: string, label: string) {
  const { hue } = categoryVisual(slug);
  return `/api/placeholder?title=${encodeURIComponent(label.slice(0, 12))}&hue=${hue}`;
}
