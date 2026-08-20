"use server";

import { revalidatePath } from "next/cache";

import { moderateReview } from "@/features/reviews/service";
import { ReviewStatus } from "@/generated/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";

export async function moderateReviewAction(formData: FormData) {
  const staff = await requirePermission("products.write", "/admin/reviews");
  const reviewId = formData.get("reviewId")?.toString();
  const status = formData.get("status")?.toString();
  if (!reviewId || (status !== "APPROVED" && status !== "REJECTED")) {
    return;
  }

  const review = await moderateReview({
    reviewId,
    status: status as ReviewStatus,
    actorId: staff.userId,
  });

  const product = await prisma.product.findUnique({
    where: { id: review.productId },
    select: { slug: true },
  });

  revalidatePath("/admin/reviews");
  if (product?.slug) {
    revalidatePath(`/product/${product.slug}`);
  }
}
