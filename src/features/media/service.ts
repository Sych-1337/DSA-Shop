import { readdir } from "fs/promises";
import path from "path";

import { prisma } from "@/lib/db/prisma";

export type MediaLibraryItem = {
  url: string;
  label: string;
  source: "upload" | "product" | "catalog" | "banner" | "category";
};

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;

async function listPublicImages(
  folder: string,
  source: MediaLibraryItem["source"],
  depth = 0,
): Promise<MediaLibraryItem[]> {
  const dir = path.join(process.cwd(), "public", folder);
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const items: MediaLibraryItem[] = [];
    for (const entry of entries) {
      if (entry.isFile() && IMAGE_EXT.test(entry.name)) {
        items.push({
          url: `/${folder}/${entry.name}`.replace(/\\/g, "/"),
          label: entry.name,
          source,
        });
      } else if (entry.isDirectory() && depth < 2) {
        items.push(
          ...(await listPublicImages(`${folder}/${entry.name}`, source, depth + 1)),
        );
      }
    }
    return items;
  } catch {
    return [];
  }
}

export async function listMediaLibrary(): Promise<MediaLibraryItem[]> {
  const [uploads, products, banners, categories, dbImages] = await Promise.all([
    listPublicImages("uploads", "upload"),
    listPublicImages("products", "catalog"),
    listPublicImages("banners", "banner"),
    listPublicImages("categories", "category"),
    prisma.productImage.findMany({
      where: { deletedAt: null },
      select: { url: true, alt: true },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
  ]);

  const seen = new Set<string>();
  const items: MediaLibraryItem[] = [];

  function push(item: MediaLibraryItem) {
    const key = item.url.trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    items.push({ ...item, url: key });
  }

  for (const item of uploads) push(item);
  for (const row of dbImages) {
    push({
      url: row.url,
      label: row.alt || row.url.split("/").pop() || row.url,
      source: "product",
    });
  }
  for (const item of products) push(item);
  for (const item of categories) push(item);
  for (const item of banners) push(item);

  return items;
}
