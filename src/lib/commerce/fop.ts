export type FopRequisites = {
  name: string;
  iban: string;
  edrpou: string;
  bankName: string;
  purpose: string;
  qrImageUrl: string;
};

/** Soft-launch defaults — override via FOP_* env on Render without redeploying copy. */
const DEFAULTS = {
  name: "Семенова Дар'я Миколаївна",
  iban: "UA443006140000026000500594304",
  edrpou: "3017916040",
  bankName: "АТ Креді Агріколь",
  purposeTemplate: "Оплата за {orderNumber}",
  qrImageUrl: "/payments/fop-qr.png",
} as const;

export function getFopRequisites(orderNumber: string): FopRequisites {
  const name = process.env.FOP_NAME?.trim() || DEFAULTS.name;
  const iban = process.env.FOP_IBAN?.trim() || DEFAULTS.iban;
  const template =
    process.env.FOP_PAYMENT_PURPOSE_TEMPLATE?.trim() || DEFAULTS.purposeTemplate;

  return {
    name,
    iban,
    edrpou: process.env.FOP_EDRPOU?.trim() || DEFAULTS.edrpou,
    bankName: process.env.FOP_BANK_NAME?.trim() || DEFAULTS.bankName,
    purpose: template.replaceAll("{orderNumber}", orderNumber),
    qrImageUrl: process.env.FOP_QR_URL?.trim() || DEFAULTS.qrImageUrl,
  };
}
