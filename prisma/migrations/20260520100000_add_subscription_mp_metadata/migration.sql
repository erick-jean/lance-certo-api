-- AlterTable
ALTER TABLE "subscriptions"
ADD COLUMN "mercadoPagoStatus" VARCHAR(50),
ADD COLUMN "metadata" JSONB;
