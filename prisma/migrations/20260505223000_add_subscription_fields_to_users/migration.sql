-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('free', 'premium');

-- CreateEnum
CREATE TYPE "SubscriptionPlanStatus" AS ENUM ('active', 'inactive', 'canceled', 'past_due');

-- AlterTable
ALTER TABLE "users"
ADD COLUMN "plan" "SubscriptionPlan" NOT NULL DEFAULT 'free',
ADD COLUMN "planStatus" "SubscriptionPlanStatus" NOT NULL DEFAULT 'inactive',
ADD COLUMN "planExpiresAt" TIMESTAMP(3);
