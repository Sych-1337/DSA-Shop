-- AlterEnum
DO $$ BEGIN
  ALTER TYPE "PaymentMethod" ADD VALUE 'BANK_TRANSFER';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
