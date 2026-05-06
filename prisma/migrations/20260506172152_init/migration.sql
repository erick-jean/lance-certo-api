/*
  Warnings:

  - The values [PENDING,APPROVED] on the enum `VehicleStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VehicleStatus_new" AS ENUM ('ANALYZING', 'REJECTED', 'PURCHASED', 'SOLD');
ALTER TABLE "public"."vehicles" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "vehicles" ALTER COLUMN "status" TYPE "VehicleStatus_new" USING ("status"::text::"VehicleStatus_new");
ALTER TYPE "VehicleStatus" RENAME TO "VehicleStatus_old";
ALTER TYPE "VehicleStatus_new" RENAME TO "VehicleStatus";
DROP TYPE "public"."VehicleStatus_old";
ALTER TABLE "vehicles" ALTER COLUMN "status" SET DEFAULT 'ANALYZING';
COMMIT;

-- AlterTable
ALTER TABLE "vehicles" ALTER COLUMN "status" SET DEFAULT 'ANALYZING';
