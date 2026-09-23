import type { EmailProvider, SendEmailInput } from "./mock";

/**
 * SMTP placeholder — use EMAIL_PROVIDER=resend for production mail.
 * Keeping the class so env switch stays documented without optional npm deps.
 */
export class SmtpEmailProvider implements EmailProvider {
  async send(_input: SendEmailInput): Promise<{ messageId: string }> {
    throw new Error(
      "EMAIL_PROVIDER=smtp requires nodemailer. Set EMAIL_PROVIDER=resend (recommended) or mock.",
    );
  }
}

export class ResendEmailProvider implements EmailProvider {
  async send(input: SendEmailInput) {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.EMAIL_FROM?.trim();
    if (!apiKey || !from) {
      throw new Error("RESEND_API_KEY and EMAIL_FROM are required");
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Resend error: ${res.status} ${text}`);
    }
    const data = (await res.json()) as { id?: string };
    return { messageId: data.id || `resend_${Date.now()}` };
  }
}
