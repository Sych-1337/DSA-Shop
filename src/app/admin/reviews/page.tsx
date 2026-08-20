import Link from "next/link";

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

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-display text-3xl font-semibold">Відгуки</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Нові відгуки з PDP потрапляють у PENDING. Після approve оновлюється рейтинг товару.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {[
          { href: "/admin/reviews", label: "Усі" },
          { href: "/admin/reviews?status=PENDING", label: "Очікують" },
          { href: "/admin/reviews?status=APPROVED", label: "Схвалені" },
          { href: "/admin/reviews?status=REJECTED", label: "Відхилені" },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-full border border-border px-3 py-1.5 hover:border-primary hover:text-primary"
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <ul className="space-y-4">
        {reviews.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Відгуків немає.
          </li>
        ) : (
          reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
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
                <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                  {review.status}
                </span>
              </div>

              {canWrite && review.status === "PENDING" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={moderateReviewAction}>
                    <input type="hidden" name="reviewId" value={review.id} />
                    <input type="hidden" name="status" value="APPROVED" />
                    <button
                      type="submit"
                      className="h-9 rounded-xl bg-primary px-3 text-sm font-semibold text-white"
                    >
                      Схвалити
                    </button>
                  </form>
                  <form action={moderateReviewAction}>
                    <input type="hidden" name="reviewId" value={review.id} />
                    <input type="hidden" name="status" value="REJECTED" />
                    <button
                      type="submit"
                      className="h-9 rounded-xl border border-border px-3 text-sm font-semibold"
                    >
                      Відхилити
                    </button>
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
