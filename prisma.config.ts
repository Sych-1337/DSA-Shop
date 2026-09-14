import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * `prisma generate` runs on Vercel during `pnpm install` and must not require a real DB.
 * Migrations / seed still use DATABASE_URL (or DIRECT_URL) from the environment.
 */
const datasourceUrl =
  process.env.DATABASE_URL?.trim() ||
  process.env.DIRECT_URL?.trim() ||
  "postgresql://build:build@127.0.0.1:5432/build?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: datasourceUrl,
  },
});
