"use server";

import { z } from "zod";

import { getEmailProvider } from "@/lib/providers";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  topic: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10).max(2000),
});

export async function submitContactMessage(formData: FormData) {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    topic: formData.get("topic") || undefined,
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { ok: false as const, error: "formInvalid" as const };
  }

  const { name, email, topic, message } = parsed.data;
  const escapedMessage = message.replaceAll("<", "&lt;").replaceAll(">", "&gt;");

  try {
    await getEmailProvider().send({
      to: "hello@da-shop.ua",
      subject: `[D&A Contact] ${topic || "Message"} — ${name}`,
      text: `From: ${name} <${email}>\nTopic: ${topic || "—"}\n\n${message}`,
      html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p><strong>Topic:</strong> ${topic || "—"}</p><pre>${escapedMessage}</pre>`,
    });
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "sendFailed" as const };
  }
}
