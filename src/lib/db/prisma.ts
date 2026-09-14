import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "@/generated/prisma";

/** Bump when schema changes so hot-reload doesn't keep a stale PrismaClient. */
const PRISMA_CLIENT_VERSION = "wishlist-share-bis-v1";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaVersion?: string;
  pgPool?: Pool;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const needsSsl =
    process.env.DATABASE_SSL === "true" ||
    /supabase\.(co|com)/i.test(connectionString) ||
    /sslmode=require/i.test(connectionString);

  const pool =
    globalForPrisma.pgPool ??
    new Pool({
      connectionString,
      // Serverless (Vercel): keep pool tiny to avoid exhausting Supabase free connections.
      max: Number(process.env.DATABASE_POOL_MAX || 1),
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 15_000,
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    });

  globalForPrisma.pgPool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

if (globalForPrisma.prisma && globalForPrisma.prismaVersion !== PRISMA_CLIENT_VERSION) {
  void globalForPrisma.prisma.$disconnect().catch(() => undefined);
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Always cache on globalThis — required for Vercel/serverless warm invocations.
globalForPrisma.prisma = prisma;
globalForPrisma.prismaVersion = PRISMA_CLIENT_VERSION;
