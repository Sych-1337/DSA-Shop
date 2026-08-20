"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import {
  cityLabel,
  getMockCities,
  getMockPoints,
  pointLabel,
} from "@/lib/providers/shipping/mock-locations";

type Method = "WAREHOUSE" | "LOCKER" | "ADDRESS";

export type ShippingPrefill = {
  shippingMethod?: Method;
  cityRef?: string | null;
  warehouseRef?: string | null;
  addressLine?: string | null;
};

export function CheckoutShippingFields({
  prefill,
  resetKey,
}: {
  prefill?: ShippingPrefill;
  resetKey?: string;
}) {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const cities = useMemo(() => getMockCities(), []);
  const [method, setMethod] = useState<Method>(prefill?.shippingMethod ?? "WAREHOUSE");
  const [cityRef, setCityRef] = useState(
    prefill?.cityRef && cities.some((row) => row.ref === prefill.cityRef)
      ? prefill.cityRef
      : (cities[0]?.ref ?? "kyiv"),
  );
  const [addressLine, setAddressLine] = useState(prefill?.addressLine ?? "");
  const [warehouseRef, setWarehouseRef] = useState(prefill?.warehouseRef ?? "");

  useEffect(() => {
    if (!prefill) return;
    setMethod(prefill.shippingMethod ?? "WAREHOUSE");
    setCityRef(
      prefill.cityRef && cities.some((row) => row.ref === prefill.cityRef)
        ? prefill.cityRef
        : (cities[0]?.ref ?? "kyiv"),
    );
    setAddressLine(prefill.addressLine ?? "");
    setWarehouseRef(prefill.warehouseRef ?? "");
  }, [resetKey, prefill, cities]);

  const city = cities.find((row) => row.ref === cityRef) ?? cities[0]!;
  const points = useMemo(
    () => getMockPoints(cityRef, method === "ADDRESS" ? undefined : method),
    [cityRef, method],
  );
  const selectedWarehouse =
    warehouseRef && points.some((point) => pointLabel(point, locale) === warehouseRef)
      ? warehouseRef
      : points[0]
        ? pointLabel(points[0], locale)
        : "";

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-muted-foreground">
        {t("npStubNote")}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span>{t("shipping")}</span>
          <select
            name="shippingMethod"
            className="h-11 w-full rounded-xl border border-border px-3"
            value={method}
            onChange={(event) => setMethod(event.target.value as Method)}
          >
            <option value="WAREHOUSE">{t("shippingWarehouse")}</option>
            <option value="LOCKER">{t("shippingLocker")}</option>
            <option value="ADDRESS">{t("shippingAddress")}</option>
          </select>
        </label>

        <label className="block space-y-1 text-sm">
          <span>{t("city")}</span>
          <select
            name="cityRef"
            className="h-11 w-full rounded-xl border border-border px-3"
            value={cityRef}
            onChange={(event) => setCityRef(event.target.value)}
            required
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
          <span>{t("addressLine")}</span>
          <input
            name="addressLine"
            required
            value={addressLine}
            onChange={(event) => setAddressLine(event.target.value)}
            placeholder={t("addressPlaceholder")}
            className="h-11 w-full rounded-xl border border-border px-3"
          />
          <input type="hidden" name="warehouseRef" value="" />
        </label>
      ) : (
        <label className="block space-y-1 text-sm">
          <span>{method === "LOCKER" ? t("locker") : t("warehouse")}</span>
          <select
            name="warehouseRef"
            required
            className="h-11 w-full rounded-xl border border-border px-3"
            key={`${cityRef}-${method}-${resetKey ?? ""}`}
            value={selectedWarehouse}
            onChange={(event) => setWarehouseRef(event.target.value)}
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
          {points.length === 0 ? (
            <p className="text-xs text-danger">{t("npNoPoints")}</p>
          ) : null}
        </label>
      )}
    </div>
  );
}
