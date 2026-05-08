-- CreateEnum
CREATE TYPE "VehicleDamageType" AS ENUM ('NONE', 'LOW_DAMAGE', 'MEDIUM_DAMAGE', 'HIGH_DAMAGE', 'FLOOD', 'OTHER');

-- AlterTable
ALTER TABLE "vehicle_evaluations" ADD COLUMN     "damageType" "VehicleDamageType" NOT NULL DEFAULT 'NONE',
ALTER COLUMN "desiredProfitMarginPercent" SET DEFAULT 15.00,
ALTER COLUMN "safetyMarginPercent" SET DEFAULT 5.00;
