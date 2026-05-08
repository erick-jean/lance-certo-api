/*
  Warnings:

  - You are about to drop the column `damageType` on the `vehicle_evaluations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "vehicle_evaluations" DROP COLUMN "damageType";

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "damageType" "VehicleDamageType" NOT NULL DEFAULT 'NONE';
