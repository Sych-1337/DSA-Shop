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

export async function sendBackInStockEmail(input: {
  to: string;
  productTitle: string;
  variantTitle: string;
  productUrl: string;
}) {
  const label =
    input.variantTitle && input.variantTitle !== "Default"
      ? `${input.productTitle} (${input.variantTitle})`
      : input.productTitle;

  await getEmailProvider().send({
    to: input.to,
    subject: `Знову в наявності · ${label}`,
    text: `${label} знову в наявності. ${input.productUrl}`,
    html: shell(
      "Знову в наявності",
      `<p><strong>${label}</strong> знову доступний для замовлення.</p>
       <p><a href="${input.productUrl}" style="color:#ff3d8d">Перейти до товару</a></p>`,
    ),
  });
}
