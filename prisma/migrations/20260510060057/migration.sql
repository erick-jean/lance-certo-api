/*
  Warnings:

  - You are about to drop the column `auctionFees` on the `vehicle_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `documentationCost` on the `vehicle_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedRepairCost` on the `vehicle_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `inspectionCost` on the `vehicle_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `transportCost` on the `vehicle_evaluations` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('DOCUMENTATION', 'REPAIR', 'AUCTION_FEE', 'TRANSPORT', 'INSPECTION', 'DEBT', 'REGULARIZATION', 'PREPARATION_SALE', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseSource" AS ENUM ('USER', 'SYSTEM', 'CHECKLIST', 'AUCTION_RULE', 'DOCUMENTATION_RULE');

-- AlterTable
ALTER TABLE "vehicle_evaluations" DROP COLUMN "auctionFees",
DROP COLUMN "documentationCost",
DROP COLUMN "estimatedRepairCost",
DROP COLUMN "inspectionCost",
DROP COLUMN "transportCost";

-- CreateTable
CREATE TABLE "evaluation_expenses" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "source" "ExpenseSource" NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "evaluation_expenses_evaluationId_idx" ON "evaluation_expenses"("evaluationId");

-- CreateIndex
CREATE INDEX "evaluation_expenses_category_idx" ON "evaluation_expenses"("category");

-- AddForeignKey
ALTER TABLE "evaluation_expenses" ADD CONSTRAINT "evaluation_expenses_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "vehicle_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
