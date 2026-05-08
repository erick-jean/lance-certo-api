/*
  Warnings:

  - You are about to drop the column `desiredProfitMargin` on the `vehicle_evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `safetyMargin` on the `vehicle_evaluations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "vehicle_evaluations" DROP COLUMN "desiredProfitMargin",
DROP COLUMN "safetyMargin",
ADD COLUMN     "desiredProfitMarginPercent" DECIMAL(5,2),
ADD COLUMN     "safetyMarginPercent" DECIMAL(5,2);
