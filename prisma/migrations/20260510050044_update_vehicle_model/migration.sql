/*
  Warnings:

  - You are about to alter the column `auctionFees` on the `vehicle_evaluations` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(5,2)`.

*/
-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('CAR', 'MOTORCYCLE', 'TRUCK', 'VAN', 'BUS');

-- AlterTable
ALTER TABLE "vehicle_evaluations" ALTER COLUMN "auctionFees" SET DEFAULT 5.00,
ALTER COLUMN "auctionFees" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "type" "VehicleType" NOT NULL DEFAULT 'CAR';
