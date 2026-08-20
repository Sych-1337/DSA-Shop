"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { submitReviewAction } from "@/features/reviews/actions";

type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  authorName: string;
  createdAt: string;
};

function Stars({ value }: { value: number }) {
  return (
    <span className="tracking-tight text-primary" aria-label={`${value}/5`}>
      {"★★★★★".slice(0, value)}
      <span className="text-muted-foreground">{"★★★★★".slice(value)}</span>
    </span>
  );
}

export function ProductReviews({
  productId,
  productSlug,
  averageRating,
  reviewCount,
  reviews,
  defaultName,
  defaultEmail,
}: {
  productId: string;
  productSlug: string;
  averageRating: number | null;
  reviewCount: number;
  reviews: ReviewRow[];
  defaultName?: string;
  defaultEmail?: string;
}) {
  const t = useTranslations("product");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-display text-3xl font-semibold">{t("reviewsTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {reviewCount > 0 && averageRating != null
              ? t("reviewsSummary", {
                  rating: averageRating.toFixed(1),
                  count: reviewCount,
                })
              : t("reviewsEmpty")}
          </p>
        </div>
        {averageRating != null ? (
          <p className="text-lg font-semibold">
            <Stars value={Math.round(averageRating)} /> {averageRating.toFixed(1)}
          </p>
        ) : null}
      </div>

      {reviews.length > 0 ? (
        <ul className="mt-6 space-y-4">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Stars value={review.rating} />
                <span className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              {review.title ? <p className="mt-2 font-semibold">{review.title}</p> : null}
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{review.body}</p>
              <p className="mt-3 text-sm font-medium">{review.authorName}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <form
        className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          setOk(false);
          const formData = new FormData(event.currentTarget);
          startTransition(async () => {
            const result = await submitReviewAction(formData);
            if (!result.ok) {
              setError(t(result.error === "invalid" ? "reviewInvalid" : "reviewFailed"));
              return;
            }
            setOk(true);
            event.currentTarget.reset();
          });
        }}
      >
        <h3 className="text-display text-xl font-semibold">{t("reviewFormTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("reviewFormLead")}</p>
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="productSlug" value={productSlug} />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span>{t("reviewName")}</span>
            <input
              name="authorName"
              required
              defaultValue={defaultName}
              className="h-11 w-full rounded-xl border border-border px-3"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span>{t("reviewEmail")}</span>
            <input
              name="authorEmail"
              type="email"
              defaultValue={defaultEmail}
              className="h-11 w-full rounded-xl border border-border px-3"
            />
          </label>
        </div>

        <label className="block space-y-1 text-sm">
          <span>{t("reviewRating")}</span>
          <select name="rating" defaultValue="5" className="h-11 w-full rounded-xl border border-border px-3 sm:max-w-xs">
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm">
          <span>{t("reviewTitle")}</span>
          <input name="title" className="h-11 w-full rounded-xl border border-border px-3" />
        </label>

        <label className="block space-y-1 text-sm">
          <span>{t("reviewBody")}</span>
          <textarea
            name="body"
            required
            minLength={10}
            rows={4}
            className="w-full rounded-xl border border-border px-3 py-2"
          />
        </label>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {ok ? <p className="text-sm text-success">{t("reviewSubmitted")}</p> : null}

        <Button type="submit" disabled={pending}>
          {pending ? t("reviewSending") : t("reviewSubmit")}
        </Button>
      </form>
    </section>
  );
}
