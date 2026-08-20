import { getTranslations } from "next-intl/server";

import { AddressManager } from "@/components/store/address-manager";
import { listCustomerAddresses } from "@/features/account/address-service";
import { Link } from "@/i18n/navigation";

export default async function AccountAddressesPage() {
  const t = await getTranslations("pages");
  const tAccount = await getTranslations("account");
  const addresses = await listCustomerAddresses();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
      <h1 className="text-display text-3xl font-semibold sm:text-4xl">{t("addresses")}</h1>
      <p className="mt-3 text-muted-foreground">{tAccount("addressesLead")}</p>

      <AddressManager
        addresses={addresses.map((row) => ({
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
      />

      <p className="mt-8 text-sm">
        <Link href="/account" className="text-primary hover:underline">
          ← {t("account")}
        </Link>
      </p>
    </main>
  );
}
