-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "customSpecs" JSONB;
