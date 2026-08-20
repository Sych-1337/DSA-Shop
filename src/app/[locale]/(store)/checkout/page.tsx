import { getLocale, getTranslations } from "next-intl/server";

import { CheckoutForm } from "@/components/store/checkout-form";
import { CouponForm } from "@/components/store/coupon-form";
import { listCustomerAddresses } from "@/features/account/address-service";
import { getCustomerAccount } from "@/features/account/service";
import { FREE_SHIPPING_THRESHOLD } from "@/features/cart/cookie";
import { calculateCartTotals, getCartIfExists } from "@/features/cart/service";
import { redirect } from "@/i18n/navigation";
import { formatMoney } from "@/lib/money";
import { getShippingProvider } from "@/lib/providers";

export default async function CheckoutPage() {
  const [t, locale] = await Promise.all([getTranslations("checkout"), getLocale()]);
  const cart = await getCartIfExists();
  if (!cart || cart.items.length === 0) {
    redirect({ href: "/cart", locale });
  }

  const activeCart = cart!;
  const totals = calculateCartTotals(activeCart);
  const goods = Math.max(0, totals.subtotalAmount - totals.discountAmount);
  const shipping = await getShippingProvider().quote({
    cityRef: "Kyiv",
    weightGrams: 500,
    subtotalAmount: goods,
    method: "WAREHOUSE",
  });

  const [{ profile, sessionUser }, addresses] = await Promise.all([
    getCustomerAccount(),
    listCustomerAddresses(),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-display text-4xl font-semibold">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("subtitle", { amount: (FREE_SHIPPING_THRESHOLD / 100).toFixed(0) })}
      </p>
      <div className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("items")}</span>
          <span>{formatMoney(totals.subtotalAmount)}</span>
        </div>
        {totals.discountAmount > 0 ? (
          <div className="flex justify-between text-sm text-success">
            <span>
              {t("discount")}
              {totals.couponCode ? ` (${totals.couponCode})` : ""}
            </span>
            <span>-{formatMoney(totals.discountAmount)}</span>
          </div>
        ) : null}
        <CouponForm appliedCode={totals.couponCode} />
      </div>

      <div className="mt-6">
        <CheckoutForm
          subtotalAmount={totals.subtotalAmount}
          discountAmount={totals.discountAmount}
          estimatedShipping={
            totals.couponType === "FREE_SHIPPING" ? 0 : shipping.amount
          }
          savedAddresses={addresses.map((row) => ({
            id: row.id,
            label: row.label,
            firstName: row.firstName,
            lastName: row.lastName,
            phone: row.phone,
            email: row.email,
            city: row.city,
            cityRef: row.cityRef,
            shippingMethod: row.shippingMethod,
            warehouseRef: row.warehouseRef,
            addressLine: row.addressLine,
            isDefault: row.isDefault,
          }))}
          contactPrefill={{
            firstName: profile?.firstName ?? undefined,
            lastName: profile?.lastName ?? undefined,
            email: sessionUser?.email ?? profile?.contactEmail ?? undefined,
            phone: profile?.phone ?? undefined,
          }}
        />
      </div>
    </main>
  );
}
