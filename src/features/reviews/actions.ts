"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCustomerAccount } from "@/features/account/service";
import { submitReview } from "@/features/reviews/service";

const reviewSchema = z.object({
  productId: z.string().min(1),
  productSlug: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(10).max(2000),
  authorName: z.string().trim().min(2).max(80),
  authorEmail: z.string().trim().email().optional().or(z.literal("")),
});

export async function submitReviewAction(formData: FormData) {
  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId")?.toString(),
    productSlug: formData.get("productSlug")?.toString(),
    rating: formData.get("rating")?.toString(),
    title: formData.get("title")?.toString() ?? "",
    body: formData.get("body")?.toString() ?? "",
    authorName: formData.get("authorName")?.toString() ?? "",
    authorEmail: formData.get("authorEmail")?.toString() ?? "",
  });

  if (!parsed.success) {
    return { ok: false as const, error: "invalid" as const };
  }

  const { profile } = await getCustomerAccount();

  try {
    await submitReview({
      productId: parsed.data.productId,
      rating: parsed.data.rating,
      title: parsed.data.title,
      body: parsed.data.body,
      authorName: parsed.data.authorName,
      authorEmail: parsed.data.authorEmail || undefined,
      customerProfileId: profile?.id,
    });
    revalidatePath(`/product/${parsed.data.productSlug}`);
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "failed" as const };
  }
}
