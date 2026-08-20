import { formatMoney } from "@/lib/money";
import { getEmailProvider } from "@/lib/providers";

function shell(title: string, body: string) {
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;background:#0b0b0f;color:#f5f5f5;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#16161d;border:1px solid #2a2a35;border-radius:16px;padding:24px">
    <p style="color:#ff3d8d;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:12px">D&A · Dreams & Anime</p>
    <h1 style="font-size:22px;margin:8px 0 16px">${title}</h1>
    ${body}
    <p style="margin-top:24px;font-size:12px;color:#9ca3af">Це демо-лист (stub). Реальний SMTP підключимо пізніше.</p>
  </div></body></html>`;
}

export async function sendOrderCreatedEmail(input: {
  to: string;
  orderNumber: string;
  totalAmount: number;
}) {
  const amount = formatMoney(input.totalAmount);
  await getEmailProvider().send({
    to: input.to,
    subject: `Замовлення ${input.orderNumber} створено — очікує оплати`,
    text: `Замовлення ${input.orderNumber} на ${amount} створено. Завершіть оплату на сайті.`,
    html: shell(
      "Замовлення створено",
      `<p>Дякуємо! Номер замовлення: <strong>${input.orderNumber}</strong></p>
       <p>Сума до оплати: <strong>${amount}</strong></p>
       <p>Оплатіть замовлення на сторінці checkout — після оплати ми передамо його на збірку.</p>`,
    ),
  });
}

export async function sendOrderPaidEmail(input: {
  to: string;
  orderNumber: string;
  totalAmount: number;
}) {
  const amount = formatMoney(input.totalAmount);
  await getEmailProvider().send({
    to: input.to,
    subject: `Оплату отримано · ${input.orderNumber}`,
    text: `Оплату замовлення ${input.orderNumber} (${amount}) підтверджено.`,
    html: shell(
      "Оплату отримано",
      `<p>Оплату замовлення <strong>${input.orderNumber}</strong> підтверджено.</p>
       <p>Сума: <strong>${amount}</strong></p>
       <p>Ми збираємо посилку та скоро надішлемо трек-номер.</p>`,
    ),
  });
}

export async function sendOrderPaymentFailedEmail(input: {
  to: string;
  orderNumber: string;
  reason: string;
}) {
  await getEmailProvider().send({
    to: input.to,
    subject: `Оплату не завершено · ${input.orderNumber}`,
    text: `Оплату замовлення ${input.orderNumber} не завершено (${input.reason}). Спробуйте ще раз.`,
    html: shell(
      "Оплату не завершено",
      `<p>Не вдалося завершити оплату замовлення <strong>${input.orderNumber}</strong>.</p>
       <p>Причина (stub): ${input.reason}</p>
       <p>Ви можете спробувати оплату знову — товари збережені в кошику / замовленні.</p>`,
    ),
  });
}
