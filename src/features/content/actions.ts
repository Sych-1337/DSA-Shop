"use server";

import { revalidatePath } from "next/cache";

import { ContentStatus } from "@/generated/prisma";
import {
  blogPostSchema,
  homepageBlockUpdateSchema,
  redirectSchema,
  seoMetaSchema,
} from "@/features/content/schema";
import { updateHomepageBlock, upsertBlogPost } from "@/features/content/service";
import { createRedirect, toggleRedirect, upsertSeoMeta } from "@/features/seo/service";
import { assertPermission } from "@/lib/auth/rbac";

export async function updateHomepageBlockAction(formData: FormData) {
  await assertPermission("content.write");
  const parsed = homepageBlockUpdateSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    subtitle: formData.get("subtitle"),
    sortOrder: formData.get("sortOrder"),
    isEnabled: formData.get("isEnabled") === "on" || formData.get("isEnabled") === "true",
    configJson: formData.get("configJson"),
  });
  if (!parsed.success) return;

  let config: unknown;
  try {
    config = JSON.parse(parsed.data.configJson);
  } catch {
    return;
  }

  await updateHomepageBlock({
    id: parsed.data.id,
    title: parsed.data.title,
    subtitle: parsed.data.subtitle,
    sortOrder: parsed.data.sortOrder,
    isEnabled: parsed.data.isEnabled,
    config: config as object,
  });

  revalidatePath("/");
  revalidatePath("/admin/content");
}

export async function saveBlogPostAction(formData: FormData) {
  await assertPermission("content.write");
  const parsed = blogPostSchema.safeParse({
    id: formData.get("id") || undefined,
    slug: formData.get("slug"),
    title: formData.get("title"),
    excerpt: formData.get("excerpt") || null,
    body: formData.get("body"),
    coverImageUrl: formData.get("coverImageUrl") || null,
    authorName: formData.get("authorName") || null,
    status: formData.get("status"),
    seoTitle: formData.get("seoTitle") || null,
    seoDescription: formData.get("seoDescription") || null,
  });
  if (!parsed.success) return;

  await upsertBlogPost({
    ...parsed.data,
    status: parsed.data.status as ContentStatus,
    coverImageUrl: parsed.data.coverImageUrl || null,
  });

  revalidatePath("/blog");
  revalidatePath(`/blog/${parsed.data.slug}`);
  revalidatePath("/admin/content");
  revalidatePath("/sitemap.xml");
}

export async function saveSeoMetaAction(formData: FormData) {
  await assertPermission("seo.write");
  const parsed = seoMetaSchema.safeParse({
    entityType: formData.get("entityType"),
    entityId: formData.get("entityId"),
    title: formData.get("title") || null,
    description: formData.get("description") || null,
    h1: formData.get("h1") || null,
    canonicalPath: formData.get("canonicalPath") || null,
    ogImageUrl: formData.get("ogImageUrl") || null,
    noindex: formData.get("noindex") === "on" || formData.get("noindex") === "true",
  });
  if (!parsed.success) return;

  await upsertSeoMeta(parsed.data);
  revalidatePath("/admin/seo");
  if (parsed.data.canonicalPath) {
    revalidatePath(parsed.data.canonicalPath);
  }
}

export async function createRedirectAction(formData: FormData) {
  await assertPermission("seo.write");
  const parsed = redirectSchema.safeParse({
    fromPath: formData.get("fromPath"),
    toPath: formData.get("toPath"),
    statusCode: formData.get("statusCode") ?? 301,
    isActive: true,
    note: formData.get("note") || null,
  });
  if (!parsed.success) return;

  await createRedirect(parsed.data);
  revalidatePath("/admin/seo");
}

export async function toggleRedirectAction(formData: FormData) {
  await assertPermission("seo.write");
  const id = formData.get("id")?.toString();
  const isActive = formData.get("isActive") === "true";
  if (!id) return;
  await toggleRedirect(id, isActive);
  revalidatePath("/admin/seo");
}
