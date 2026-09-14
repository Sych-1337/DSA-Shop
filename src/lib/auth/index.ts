import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";

import { prisma } from "@/lib/db/prisma";

const secret = process.env.BETTER_AUTH_SECRET?.trim();
const baseURL = (process.env.BETTER_AUTH_URL || process.env.APP_URL)?.trim();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: secret && secret.length >= 32 ? secret : undefined,
  baseURL: baseURL || undefined,
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {},
  },
});

export type Session = typeof auth.$Infer.Session;
