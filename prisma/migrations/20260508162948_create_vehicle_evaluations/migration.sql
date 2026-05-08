-- CreateEnum
CREATE TYPE "EvaluationRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "EvaluationRecommendation" AS ENUM ('RECOMMENDED', 'CAUTION', 'NOT_RECOMMENDED');

-- CreateTable
CREATE TABLE "vehicle_evaluations" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "estimatedRepairCost" DECIMAL(12,2),
    "auctionFees" DECIMAL(12,2),
    "documentationCost" DECIMAL(12,2),
    "transportCost" DECIMAL(12,2),
    "inspectionCost" DECIMAL(12,2),
    "desiredProfitMargin" DECIMAL(12,2),
    "safetyMargin" DECIMAL(12,2),
    "maxRecommendedBid" DECIMAL(12,2),
    "estimatedFinalCost" DECIMAL(12,2),
    "estimatedProfit" DECIMAL(12,2),
    "riskLevel" "EvaluationRiskLevel",
    "recommendation" "EvaluationRecommendation",
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "lastCalculatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_evaluations_vehicleId_key" ON "vehicle_evaluations"("vehicleId");

-- CreateIndex
CREATE INDEX "vehicle_evaluations_vehicleId_idx" ON "vehicle_evaluations"("vehicleId");

-- CreateIndex
CREATE INDEX "vehicle_evaluations_riskLevel_idx" ON "vehicle_evaluations"("riskLevel");

-- CreateIndex
CREATE INDEX "vehicle_evaluations_recommendation_idx" ON "vehicle_evaluations"("recommendation");

-- AddForeignKey
ALTER TABLE "vehicle_evaluations" ADD CONSTRAINT "vehicle_evaluations_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
