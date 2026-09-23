import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(8).optional(),
  STORAGE_PROVIDER: z.string().default("local"),
  SUPABASE_URL: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : undefined)),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : undefined)),
  SUPABASE_STORAGE_BUCKET: z.string().optional(),
  DATABASE_SSL: z.string().optional(),
  DATABASE_POOL_MAX: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  PAYMENT_PROVIDER: z.string().default("mock"),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
  WAYFORPAY_MERCHANT_ACCOUNT: z.string().optional(),
  WAYFORPAY_SECRET_KEY: z.string().optional(),
  WAYFORPAY_MERCHANT_DOMAIN: z.string().optional(),
  FOP_NAME: z.string().optional(),
  FOP_IBAN: z.string().optional(),
  FOP_EDRPOU: z.string().optional(),
  FOP_BANK_NAME: z.string().optional(),
  AUTH_TRUSTED_ORIGINS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  UNPAID_ORDER_CANCEL_HOURS: z.string().optional(),
  SHIPPING_PROVIDER: z.string().default("mock"),
  EMAIL_PROVIDER: z.string().default("mock"),
  ANALYTICS_PROVIDER: z.string().default("mock"),
  CRON_SECRET: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),
  ADMIN_AUTH_BYPASS: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export function getEnv(): AppEnv {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }
  return parsed.data;
}
