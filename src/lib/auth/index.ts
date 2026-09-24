import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";

import { prisma } from "@/lib/db/prisma";

const secret = process.env.BETTER_AUTH_SECRET?.trim();
const baseURL = (process.env.BETTER_AUTH_URL || process.env.APP_URL)?.trim().replace(/\/$/, "");

/** Allow onrender.com while custom-domain SSL is pending (and any AUTH_TRUSTED_ORIGINS). */
function trustedOrigins(): string[] {
  const origins = new Set<string>();
  const add = (value?: string) => {
    if (!value) return;
    for (const part of value.split(",")) {
      const origin = part.trim().replace(/\/$/, "");
      if (origin) origins.add(origin);
    }
  };
  add(baseURL);
  add(process.env.APP_URL);
  add(process.env.BETTER_AUTH_URL);
  add(process.env.RENDER_EXTERNAL_URL);
  add(process.env.AUTH_TRUSTED_ORIGINS);
  if (process.env.RENDER_EXTERNAL_HOSTNAME) {
    origins.add(`https://${process.env.RENDER_EXTERNAL_HOSTNAME.replace(/\/$/, "")}`);
  }
  return [...origins];
}

const googleId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const appleId = process.env.APPLE_CLIENT_ID?.trim();
const appleSecret = process.env.APPLE_CLIENT_SECRET?.trim();

const socialProviders = {
  ...(googleId && googleSecret
    ? {
        google: {
          clientId: googleId,
          clientSecret: googleSecret,
        },
      }
    : {}),
  ...(appleId && appleSecret
    ? {
        apple: {
          clientId: appleId,
          clientSecret: appleSecret,
        },
      }
    : {}),
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: secret && secret.length >= 32 ? secret : undefined,
  baseURL: baseURL || undefined,
  trustedOrigins: trustedOrigins(),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders,
  user: {
    additionalFields: {},
  },
});

export type Session = typeof auth.$Infer.Session;

export function isSocialAuthConfigured(provider: "google" | "apple") {
  return Boolean(
    provider === "google"
      ? googleId && googleSecret
      : appleId && appleSecret,
  );
}
