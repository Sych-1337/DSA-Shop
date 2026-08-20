import { ReviewStatus } from "@/generated/prisma";
import { prisma } from "@/lib/db/prisma";

async function refreshProductRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId, status: ReviewStatus.APPROVED },
    _avg: { rating: true },
    _count: { _all: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      averageRating: agg._count._all > 0 ? agg._avg.rating : null,
      reviewCount: agg._count._all,
    },
  });
}

export async function listApprovedReviews(productId: string) {
  return prisma.review.findMany({
    where: { productId, status: ReviewStatus.APPROVED },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function submitReview(input: {
  productId: string;
  rating: number;
  title?: string;
  body: string;
  authorName: string;
  authorEmail?: string;
  customerProfileId?: string | null;
}) {
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw new Error("PRODUCT_NOT_FOUND");

  const review = await prisma.review.create({
    data: {
      productId: input.productId,
      rating: input.rating,
      title: input.title?.trim() || null,
      body: input.body.trim(),
      authorName: input.authorName.trim(),
      authorEmail: input.authorEmail?.trim().toLowerCase() || null,
      customerProfileId: input.customerProfileId ?? null,
      status: ReviewStatus.PENDING,
    },
  });

  return review;
}

export async function listAdminReviews(status?: ReviewStatus) {
  return prisma.review.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      product: { select: { id: true, title: true, slug: true } },
    },
  });
}

export async function moderateReview(input: {
  reviewId: string;
  status: ReviewStatus;
  actorId?: string;
}) {
  const review = await prisma.review.update({
    where: { id: input.reviewId },
    data: {
      status: input.status,
      moderatedAt: new Date(),
      moderatedById: input.actorId ?? null,
    },
  });
  await refreshProductRating(review.productId);
  return review;
}

export async function seedApprovedReview(input: {
  productId: string;
  rating: number;
  title?: string;
  body: string;
  authorName: string;
}) {
  const existing = await prisma.review.findFirst({
    where: {
      productId: input.productId,
      authorName: input.authorName,
      body: input.body,
    },
  });
  if (existing) return existing;

  const review = await prisma.review.create({
    data: {
      ...input,
      title: input.title ?? null,
      status: ReviewStatus.APPROVED,
      moderatedAt: new Date(),
    },
  });
  await refreshProductRating(input.productId);
  return review;
}
