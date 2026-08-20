"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  createCustomerAddressAction,
  deleteCustomerAddressAction,
  setDefaultCustomerAddressAction,
} from "@/features/account/address-actions";
import {
  cityLabel,
  getMockCities,
  getMockPoints,
  pointLabel,
} from "@/lib/providers/shipping/mock-locations";

type AddressRow = {
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

type Method = "WAREHOUSE" | "LOCKER" | "ADDRESS";

export function AddressManager({ addresses }: { addresses: AddressRow[] }) {
  const t = useTranslations("account");
  const tCheckout = useTranslations("checkout");
  const locale = useLocale();
  const cities = useMemo(() => getMockCities(), []);
  const [method, setMethod] = useState<Method>("WAREHOUSE");
  const [cityRef, setCityRef] = useState(cities[0]?.ref ?? "kyiv");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const city = cities.find((row) => row.ref === cityRef) ?? cities[0]!;
  const points = useMemo(
    () => getMockPoints(cityRef, method === "ADDRESS" ? undefined : method),
    [cityRef, method],
  );

  return (
    <div className="mt-8 space-y-8">
      {addresses.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          {t("addressesEmpty")}
        </p>
      ) : (
        <ul className="space-y-3">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {address.label}
                    {address.isDefault ? (
                      <span className="ml-2 text-xs font-normal text-primary">
                        {t("addressDefault")}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-sm">
                    {address.firstName} {address.lastName} · {address.phone}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {address.city}
                    {address.shippingMethod === "ADDRESS"
                      ? ` · ${address.addressLine}`
                      : ` · ${address.warehouseRef}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!address.isDefault ? (
                    <form
                      action={(formData) => {
                        startTransition(async () => {
                          await setDefaultCustomerAddressAction(formData);
                        });
                      }}
                    >
                      <input type="hidden" name="addressId" value={address.id} />
                      <Button type="submit" variant="outline" size="sm" disabled={pending}>
                        {t("addressSetDefault")}
                      </Button>
                    </form>
                  ) : null}
                  <form
                    action={(formData) => {
                      startTransition(async () => {
                        await deleteCustomerAddressAction(formData);
                      });
                    }}
                  >
                    <input type="hidden" name="addressId" value={address.id} />
                    <Button type="submit" variant="ghost" size="sm" disabled={pending}>
                      {t("addressDelete")}
                    </Button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6">
        <h2 className="text-display text-xl font-semibold">{t("addressAddTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("addressAddLead")}</p>

        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            setSaved(false);
            const formData = new FormData(event.currentTarget);
            startTransition(async () => {
              const result = await createCustomerAddressAction(formData);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setSaved(true);
              event.currentTarget.reset();
              setMethod("WAREHOUSE");
              setCityRef(cities[0]?.ref ?? "kyiv");
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span>{t("addressLabel")}</span>
              <input
                name="label"
                defaultValue={t("addressLabelDefault")}
                className="h-11 w-full rounded-xl border border-border px-3"
              />
            </label>
            <label className="inline-flex items-center gap-2 pt-7 text-sm">
              <input type="checkbox" name="isDefault" className="size-4 rounded border-border" />
              {t("addressMakeDefault")}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span>{t("firstName")}</span>
              <input name="firstName" required className="h-11 w-full rounded-xl border border-border px-3" />
            </label>
            <label className="block space-y-1 text-sm">
              <span>{t("lastName")}</span>
              <input name="lastName" required className="h-11 w-full rounded-xl border border-border px-3" />
            </label>
            <label className="block space-y-1 text-sm">
              <span>{t("phone")}</span>
              <input name="phone" required placeholder="+380..." className="h-11 w-full rounded-xl border border-border px-3" />
            </label>
            <label className="block space-y-1 text-sm">
              <span>{t("email")}</span>
              <input name="email" type="email" className="h-11 w-full rounded-xl border border-border px-3" />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span>{tCheckout("shipping")}</span>
              <select
                name="shippingMethod"
                className="h-11 w-full rounded-xl border border-border px-3"
                value={method}
                onChange={(event) => setMethod(event.target.value as Method)}
              >
                <option value="WAREHOUSE">{tCheckout("shippingWarehouse")}</option>
                <option value="LOCKER">{tCheckout("shippingLocker")}</option>
                <option value="ADDRESS">{tCheckout("shippingAddress")}</option>
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span>{t("city")}</span>
              <select
                name="cityRef"
                className="h-11 w-full rounded-xl border border-border px-3"
                value={cityRef}
                onChange={(event) => setCityRef(event.target.value)}
              >
                {cities.map((row) => (
                  <option key={row.ref} value={row.ref}>
                    {cityLabel(row, locale)}
                  </option>
                ))}
              </select>
              <input type="hidden" name="city" value={cityLabel(city, locale)} />
            </label>
          </div>

          {method === "ADDRESS" ? (
            <label className="block space-y-1 text-sm">
              <span>{tCheckout("addressLine")}</span>
              <input
                name="addressLine"
                required
                placeholder={tCheckout("addressPlaceholder")}
                className="h-11 w-full rounded-xl border border-border px-3"
              />
            </label>
          ) : (
            <label className="block space-y-1 text-sm">
              <span>{method === "LOCKER" ? tCheckout("locker") : tCheckout("warehouse")}</span>
              <select
                name="warehouseRef"
                required
                className="h-11 w-full rounded-xl border border-border px-3"
                key={`${cityRef}-${method}`}
                defaultValue={points[0] ? pointLabel(points[0], locale) : undefined}
              >
                {points.map((point) => {
                  const label = pointLabel(point, locale);
                  return (
                    <option key={point.ref} value={label}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </label>
          )}

          {error ? <p className="text-sm text-danger">{error}</p> : null}
          {saved ? <p className="text-sm text-success">{t("addressSaved")}</p> : null}

          <Button type="submit" disabled={pending}>
            {pending ? t("saving") : t("addressSave")}
          </Button>
        </form>
      </section>
    </div>
  );
}
