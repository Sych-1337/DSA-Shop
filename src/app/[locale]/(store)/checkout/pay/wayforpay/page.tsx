import { redirect } from "next/navigation";

import { WayForPayAutoSubmitForm } from "@/components/store/wayforpay-auto-submit";

type Payload = {
  merchantAccount: string;
  merchantDomainName: string;
  orderReference: string;
  orderDate: number;
  amount: string;
  currency: string;
  productName: string[];
  productCount: string[];
  productPrice: string[];
  serviceUrl: string;
  returnUrl: string;
  clientEmail?: string;
  merchantSignature: string;
};

export default async function WayForPayRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ payload?: string }>;
}) {
  const { locale } = await params;
  const { payload: raw } = await searchParams;
  if (!raw) redirect(`/${locale}/checkout`);

  let payload: Payload;
  try {
    payload = JSON.parse(decodeURIComponent(raw)) as Payload;
  } catch {
    redirect(`/${locale}/checkout`);
  }

  const fields: Array<[string, string]> = [
    ["merchantAccount", payload.merchantAccount],
    ["merchantDomainName", payload.merchantDomainName],
    ["orderReference", payload.orderReference],
    ["orderDate", String(payload.orderDate)],
    ["amount", payload.amount],
    ["currency", payload.currency],
    ["serviceUrl", payload.serviceUrl],
    ["returnUrl", payload.returnUrl],
    ["merchantSignature", payload.merchantSignature],
  ];
  if (payload.clientEmail) fields.push(["clientEmail", payload.clientEmail]);
  payload.productName.forEach((name, i) => {
    fields.push([`productName[]`, name]);
    fields.push([`productCount[]`, payload.productCount[i] ?? "1"]);
    fields.push([`productPrice[]`, payload.productPrice[i] ?? payload.amount]);
  });

  return (
    <WayForPayAutoSubmitForm
      action="https://secure.wayforpay.com/pay"
      fields={fields}
    />
  );
}
