export type FopRequisites = {
  name: string;
  iban: string;
  edrpou: string;
  bankName: string;
  purpose: string;
};

export function getFopRequisites(orderNumber: string): FopRequisites | null {
  const name = process.env.FOP_NAME?.trim();
  const iban = process.env.FOP_IBAN?.trim();
  if (!name || !iban) return null;

  const template =
    process.env.FOP_PAYMENT_PURPOSE_TEMPLATE?.trim() || "Замовлення {orderNumber}";
  return {
    name,
    iban,
    edrpou: process.env.FOP_EDRPOU?.trim() || "",
    bankName: process.env.FOP_BANK_NAME?.trim() || "",
    purpose: template.replaceAll("{orderNumber}", orderNumber),
  };
}
