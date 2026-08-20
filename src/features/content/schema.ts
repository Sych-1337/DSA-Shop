import { z } from "zod";

export const homepageBlockUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().max(200).optional().nullable(),
  subtitle: z.string().max(500).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isEnabled: z.coerce.boolean(),
  configJson: z.string().min(2),
});

export const blogPostSchema = z.object({
  id: z.string().optional(),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers, hyphens"),
  title: z.string().min(2).max(200),
  excerpt: z.string().max(500).optional().nullable(),
  body: z.string().min(10),
  coverImageUrl: z.string().max(500).optional().nullable().or(z.literal("")),
  authorName: z.string().max(120).optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(320).optional().nullable(),
});

export const seoMetaSchema = z.object({
  entityType: z.string().min(1).max(40),
  entityId: z.string().min(1).max(120),
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(320).optional().nullable(),
  h1: z.string().max(200).optional().nullable(),
  canonicalPath: z.string().max(240).optional().nullable(),
  ogImageUrl: z.string().max(500).optional().nullable(),
  noindex: z.coerce.boolean().optional(),
});

export const redirectSchema = z.object({
  fromPath: z
    .string()
    .min(1)
    .max(240)
    .regex(/^\//, "Must start with /"),
  toPath: z
    .string()
    .min(1)
    .max(240)
    .regex(/^\//, "Must start with /"),
  statusCode: z.coerce.number().int().refine((n) => n === 301 || n === 302, "301 or 302"),
  isActive: z.coerce.boolean().optional(),
  note: z.string().max(240).optional().nullable(),
});
