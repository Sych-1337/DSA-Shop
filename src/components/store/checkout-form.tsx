"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  CheckoutShippingFields,
  type ShippingPrefill,
} from "@/components/store/checkout-shipping-fields";
import { placeOrderAction } from "@/features/cart/actions";
import { Link, useRouter } from "@/i18n/navigation";
import { formatMoney } from "@/lib/money";

export type CheckoutSavedAddress = {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  city: string;
  cityRef: string | null;
  shippingMethod: "WAREHOUSE" | "LOCKER" | "ADDRESS";
  warehouseRef: string | null;
  addressLine: string | null;
  isDefault: boolean;
};

export type CheckoutContactPrefill = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

export function CheckoutForm({
  subtotalAmount,
  discountAmount,
  estimatedShipping,
  savedAddresses = [],
  contactPrefill,
}: {
  subtotalAmount: number;
  discountAmount: number;
  estimatedShipping: number;
  savedAddresses?: CheckoutSavedAddress[];
  contactPrefill?: CheckoutContactPrefill;
}) {
  const t = useTranslations("checkout");
  const tAccount = useTranslations("account");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const idempotencyKey = useMemo(() => crypto.randomUUID(), []);

  const defaultAddress = savedAddresses.find((row) => row.isDefault) ?? savedAddresses[0] ?? null;
  const [selectedAddressId, setSelectedAddressId] = useState<string>(defaultAddress?.id ?? "");
  const selected = savedAddresses.find((row) => row.id === selectedAddressId) ?? null;

  const [firstName, setFirstName] = useState(
    selected?.firstName ?? contactPrefill?.firstName ?? "",
  );
  const [lastName, setLastName] = useState(selected?.lastName ?? contactPrefill?.lastName ?? "");
  const [email, setEmail] = useState(selected?.email ?? contactPrefill?.email ?? "");
  const [phone, setPhone] = useState(selected?.phone ?? contactPrefill?.phone ?? "");

  const shippingPrefill: ShippingPrefill | undefined = selected
    ? {
        shippingMethod: selected.shippingMethod,
        cityRef: selected.cityRef,
        warehouseRef: selected.warehouseRef,
        addressLine: selected.addressLine,
      }
    : undefined;

  const total = Math.max(0, subtotalAmount - discountAmount) + estimatedShipping;

  function applyAddress(addressId: string) {
    setSelectedAddressId(addressId);
    const address = savedAddresses.find((row) => row.id === addressId);
    if (!address) return;
    setFirstName(address.firstName);
    setLastName(address.lastName);
    setEmail(address.email ?? contactPrefill?.email ?? "");
    setPhone(address.phone);
  }

  return (
    <form
      className="space-y-4"
      action={(formData) => {
        startTransition(async () => {
          const result = await placeOrderAction(formData);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.push(result.redirectUrl);
        });
      }}
    >
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      {savedAddresses.length > 0 ? (
        <div className="space-y-2 rounded-2xl border border-border bg-surface-muted p-4">
          <p className="text-sm font-medium">{t("savedAddresses")}</p>
          <select
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
            value={selectedAddressId}
            onChange={(event) => applyAddress(event.target.value)}
          >
            {savedAddresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.label}
                {address.isDefault ? ` (${tAccount("addressDefault")})` : ""} — {address.city}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            <Link href="/account/addresses" className="text-primary hover:underline">
              {t("manageAddresses")}
            </Link>
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          <Link href="/account/addresses" className="text-primary hover:underline">
            {t("saveAddressHint")}
          </Link>
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span>{t("firstName")}</span>
          <input
            name="firstName"
            required
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className="h-11 w-full rounded-xl border border-border px-3"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{t("lastName")}</span>
          <input
            name="lastName"
            required
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className="h-11 w-full rounded-xl border border-border px-3"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span>{t("email")}</span>
          <input
            name="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 w-full rounded-xl border border-border px-3"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>{t("phone")}</span>
          <input
            name="phone"
            required
            placeholder="+380..."
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="h-11 w-full rounded-xl border border-border px-3"
          />
        </label>
      </div>

      <CheckoutShippingFields prefill={shippingPrefill} resetKey={selectedAddressId || "none"} />

      <div className="block space-y-2 text-sm">
        <span>{t("payment")}</span>
        <p className="text-xs text-muted-foreground">{t("paymentPrepaidOnly")}</p>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-3">
          <input
            type="radio"
            name="paymentMethod"
            value="BANK_TRANSFER"
            defaultChecked
            className="mt-1"
          />
          <span>
            <span className="font-medium">{t("paymentBankTransfer")}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {t("paymentBankTransferHint")}
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-3">
          <input type="radio" name="paymentMethod" value="ONLINE" className="mt-1" />
          <span>
            <span className="font-medium">{t("paymentOnline")}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {t("paymentOnlineHint")}
            </span>
          </span>
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span>{t("comment")}</span>
        <textarea name="customerNote" rows={3} className="w-full rounded-xl border border-border px-3 py-2" />
      </label>

      <div className="rounded-2xl border border-border bg-surface-muted p-4 text-sm">
        <div className="flex justify-between">
          <span>{t("items")}</span>
          <span>{formatMoney(subtotalAmount)}</span>
        </div>
        {discountAmount > 0 ? (
          <div className="mt-1 flex justify-between text-success">
            <span>{t("discount")}</span>
            <span>-{formatMoney(discountAmount)}</span>
          </div>
        ) : null}
        <div className="mt-1 flex justify-between">
          <span>{t("shippingEstimate")}</span>
          <span>{estimatedShipping === 0 ? t("free") : formatMoney(estimatedShipping)}</span>
        </div>
        <div className="mt-3 flex justify-between text-base font-bold">
          <span>{t("total")}</span>
          <span>{formatMoney(total)}</span>
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? t("placing") : t("placeOrder")}
      </Button>
    </form>
  );
}
