export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type StubEmailMessage = {
  id: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  createdAt: string;
};

export interface EmailProvider {
  send(input: SendEmailInput): Promise<{ messageId: string }>;
}

const globalForEmail = globalThis as unknown as {
  mockEmailInbox?: StubEmailMessage[];
};

function inbox() {
  if (!globalForEmail.mockEmailInbox) {
    globalForEmail.mockEmailInbox = [];
  }
  return globalForEmail.mockEmailInbox;
}

export function getMockEmailInbox(): StubEmailMessage[] {
  return [...inbox()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function clearMockEmailInbox() {
  globalForEmail.mockEmailInbox = [];
}

export class MockEmailProvider implements EmailProvider {
  async send(input: SendEmailInput) {
    const messageId = `mock_email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    inbox().unshift({
      id: messageId,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      createdAt: new Date().toISOString(),
    });
    // Keep last 100 for local DX
    if (inbox().length > 100) {
      globalForEmail.mockEmailInbox = inbox().slice(0, 100);
    }
    console.info("[MockEmail]", input.to, input.subject);
    return { messageId };
  }
}
