import Link from "next/link";

import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Button } from "@/components/ui/button";
import { moderateReviewAction } from "@/features/reviews/admin-actions";
import { listAdminReviews } from "@/features/reviews/service";
import { ReviewStatus } from "@/generated/prisma";
import { requirePermission, staffHasPermission } from "@/lib/auth/rbac";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const staff = await requirePermission("products.read", "/admin/reviews");
  const canWrite = staffHasPermission(staff, "products.write");
  const { status: statusParam } = await searchParams;
  const status =
    statusParam === "PENDING" || statusParam === "APPROVED" || statusParam === "REJECTED"
      ? (statusParam as ReviewStatus)
      : undefined;
  const reviews = await listAdminReviews(status);

  const chips = [
    { href: "/admin/reviews", label: "Усі", key: "all" },
    { href: "/admin/reviews?status=PENDING", label: "Очікують", key: "PENDING" },
    { href: "/admin/reviews?status=APPROVED", label: "Схвалені", key: "APPROVED" },
    { href: "/admin/reviews?status=REJECTED", label: "Відхилені", key: "REJECTED" },
  ].map((tab) => ({
    ...tab,
    active: (status ?? "all") === tab.key,
  }));

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Відгуки"
        description="Нові відгуки з PDP у PENDING. Після approve оновлюється рейтинг товару."
        meta={`Знайдено: ${reviews.length}`}
      />

      <AdminFilterBar chips={chips} />

      <ul className="space-y-3">
        {reviews.length === 0 ? (
          <li className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Відгуків немає.
          </li>
        ) : (
          reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {review.rating}/5 ·{" "}
                    <Link
                      href={`/uk/product/${review.product.slug}`}
                      className="text-primary hover:underline"
                    >
                      {review.product.title}
                    </Link>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {review.authorName}
                    {review.authorEmail ? ` · ${review.authorEmail}` : ""} ·{" "}
                    {review.createdAt.toLocaleString("uk-UA")}
                  </p>
                  {review.title ? <p className="mt-3 font-medium">{review.title}</p> : null}
                  <p className="mt-2 text-sm leading-relaxed">{review.body}</p>
                </div>
                <AdminStatusBadge
                  tone={
                    review.status === "APPROVED"
                      ? "success"
                      : review.status === "REJECTED"
                        ? "danger"
                        : "warning"
                  }
                >
                  {review.status === "PENDING"
                    ? "Очікує"
                    : review.status === "APPROVED"
                      ? "Схвалено"
                      : "Відхилено"}
                </AdminStatusBadge>
              </div>

              {canWrite && review.status === "PENDING" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={moderateReviewAction}>
                    <input type="hidden" name="reviewId" value={review.id} />
                    <input type="hidden" name="status" value="APPROVED" />
                    <Button type="submit" size="sm">
                      Схвалити
                    </Button>
                  </form>
                  <form action={moderateReviewAction}>
                    <input type="hidden" name="reviewId" value={review.id} />
                    <input type="hidden" name="status" value="REJECTED" />
                    <Button type="submit" variant="secondary" size="sm">
                      Відхилити
                    </Button>
                  </form>
                </div>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
