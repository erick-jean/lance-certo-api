-- AlterEnum
ALTER TYPE "SubscriptionPlanStatus" ADD VALUE 'NONE';

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "planStatus" SET DEFAULT 'NONE';

-- DataMigration
UPDATE "users"
SET "planStatus" = 'NONE'
WHERE "plan" = 'FREE'
  AND "planStatus" = 'PENDING';

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'PREMIUM',
    "status" "SubscriptionPlanStatus" NOT NULL DEFAULT 'PENDING',
    "mercadoPagoPreapprovalId" VARCHAR(255),
    "mercadoPagoPayerId" VARCHAR(255),
    "mercadoPagoCollectorId" VARCHAR(255),
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'BRL',
    "reason" VARCHAR(255),
    "externalReference" VARCHAR(255),
    "startedAt" TIMESTAMP(3),
    "nextPaymentAt" TIMESTAMP(3),
    "lastPaymentAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_mercadoPagoPreapprovalId_key" ON "subscriptions"("mercadoPagoPreapprovalId");

-- CreateIndex
CREATE INDEX "subscriptions_userId_idx" ON "subscriptions"("userId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
