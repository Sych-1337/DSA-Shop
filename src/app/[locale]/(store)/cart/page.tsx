import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import { Button } from "@/components/ui/button";
import { CouponForm } from "@/components/store/coupon-form";
import { removeCartItemAction, updateCartItemAction } from "@/features/cart/actions";
import { calculateCartTotals, getCartIfExists } from "@/features/cart/service";
import { freeShippingProgress } from "@/features/checkout/service";
import { formatMoney } from "@/lib/money";

export default async function CartPage() {
  const t = await getTranslations("cart");
  const cart = await getCartIfExists();

  if (!cart || cart.items.length === 0) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-display text-3xl font-semibold sm:text-4xl">{t("title")}</h1>
        <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="font-semibold">{t("empty")}</p>
          <Button href="/catalog" className="mt-4">
            {t("toCatalog")}
          </Button>
        </div>
      </main>
    );
  }

  const totals = calculateCartTotals(cart);
  const progress = freeShippingProgress(Math.max(0, totals.subtotalAmount - totals.discountAmount));
  const goodsTotal = formatMoney(Math.max(0, totals.subtotalAmount - totals.discountAmount));

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-display text-3xl font-semibold sm:text-4xl">{t("title")}</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          {cart.items.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:flex-row"
            >
              <div className="flex gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.variant.product.images[0]?.url ?? "/api/placeholder?title=Item&hue=320"}
                  alt={item.variant.product.title}
                  className="size-24 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${item.variant.product.slug}`}
                    className="font-semibold hover:text-primary"
                  >
                    {item.variant.product.title}
                  </Link>
                  <p className="text-muted-foreground text-sm">{item.variant.title}</p>
                  <p className="mt-1 font-semibold text-primary">
                    {formatMoney(item.variant.priceAmount)}
                  </p>
                  <p className="mt-2 font-semibold sm:hidden">
                    {formatMoney(item.variant.priceAmount * item.quantity)}
                  </p>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 sm:items-end">
                <p className="hidden font-semibold sm:block">
                  {formatMoney(item.variant.priceAmount * item.quantity)}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <form action={updateCartItemAction} className="flex items-center gap-2">
                    <input type="hidden" name="itemId" value={item.id} />
                    <label className="text-sm text-muted-foreground">
                      {t("qty")}
                      <input
                        name="quantity"
                        type="number"
                        min={0}
                        defaultValue={item.quantity}
                        className="ml-2 h-9 w-16 rounded-lg border border-border bg-background px-2"
                      />
                    </label>
                    <Button type="submit" size="sm" variant="secondary">
                      {t("update")}
                    </Button>
                  </form>
                  <form action={removeCartItemAction}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      {t("remove")}
                    </Button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-display text-xl font-semibold">{t("summary")}</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("items")}</dt>
              <dd>{formatMoney(totals.subtotalAmount)}</dd>
            </div>
            {totals.discountAmount > 0 ? (
              <div className="flex justify-between text-success">
                <dt>
                  {t("discount")}
                  {totals.couponCode ? ` (${totals.couponCode})` : ""}
                </dt>
                <dd>-{formatMoney(totals.discountAmount)}</dd>
              </div>
            ) : null}
            {totals.couponType === "FREE_SHIPPING" && totals.couponCode ? (
              <div className="flex justify-between text-success">
                <dt>{t("couponFreeShipping")}</dt>
                <dd>{totals.couponCode}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-4">
            <CouponForm appliedCode={totals.couponCode} />
          </div>

          <div className="mt-4 rounded-xl bg-surface-muted p-3 text-xs">
            {progress.reached ? (
              <p className="font-semibold text-success">{t("freeShipping")}</p>
            ) : (
              <p>
                {t("freeShippingLeft", { amount: formatMoney(progress.remaining) })}
              </p>
            )}
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
              <div className="h-full bg-primary" style={{ width: `${progress.percent}%` }} />
            </div>
          </div>

          <p className="mt-4 text-lg font-bold">{t("payGoods", { amount: goodsTotal })}</p>
          <Button href="/checkout" size="lg" className="mt-4 w-full">
            {t("checkout")}
          </Button>
        </aside>
      </div>
    </main>
  );
}
