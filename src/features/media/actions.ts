"use server";

import { randomBytes } from "crypto";

import {
  ALLOWED_IMAGE_MIME,
  EXT_BY_MIME,
  MAX_IMAGE_BYTES,
} from "@/features/media/constants";
import { listMediaLibrary, type MediaLibraryItem } from "@/features/media/service";
import { assertPermission } from "@/lib/auth/rbac";
import { getStorageProvider } from "@/lib/providers";

function sanitizeBaseName(name: string) {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9а-яіїєґ_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function listAdminMediaAction(): Promise<{
  ok: true;
  items: MediaLibraryItem[];
} | { ok: false; error: string }> {
  try {
    await assertPermission("products.write");
    const items = await listMediaLibrary();
    return { ok: true, items };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Не вдалося завантажити бібліотеку",
    };
  }
}

export async function uploadAdminImageAction(formData: FormData): Promise<{
  ok: true;
  url: string;
} | { ok: false; error: string }> {
  try {
    await assertPermission("products.write");
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Оберіть файл зображення" };
    }
    if (!ALLOWED_IMAGE_MIME.has(file.type)) {
      return { ok: false, error: "Дозволені формати: JPG, PNG, WebP, GIF" };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, error: "Максимальний розмір файлу — 5 МБ" };
    }

    const ext = EXT_BY_MIME[file.type] ?? "jpg";
    const base = sanitizeBaseName(file.name) || "image";
    const key = `products/${Date.now()}-${randomBytes(4).toString("hex")}-${base}.${ext}`;
    const body = Buffer.from(await file.arrayBuffer());
    const storage = getStorageProvider();
    const result = await storage.upload({
      key,
      body,
      contentType: file.type,
    });
    return { ok: true, url: result.url };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Помилка завантаження",
    };
  }
}
