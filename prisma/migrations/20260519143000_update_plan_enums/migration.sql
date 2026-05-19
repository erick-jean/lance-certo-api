-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionPlan_new" AS ENUM ('FREE', 'PREMIUM');
ALTER TABLE "public"."users" ALTER COLUMN "plan" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "plan" TYPE "SubscriptionPlan_new" USING (
  CASE "plan"::text
    WHEN 'free' THEN 'FREE'
    WHEN 'premium' THEN 'PREMIUM'
    ELSE "plan"::text
  END::"SubscriptionPlan_new"
);
ALTER TYPE "SubscriptionPlan" RENAME TO "SubscriptionPlan_old";
ALTER TYPE "SubscriptionPlan_new" RENAME TO "SubscriptionPlan";
DROP TYPE "public"."SubscriptionPlan_old";
ALTER TABLE "users" ALTER COLUMN "plan" SET DEFAULT 'FREE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionPlanStatus_new" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED', 'REJECTED');
ALTER TABLE "public"."users" ALTER COLUMN "planStatus" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "planStatus" TYPE "SubscriptionPlanStatus_new" USING (
  CASE "planStatus"::text
    WHEN 'inactive' THEN 'PENDING'
    WHEN 'active' THEN 'ACTIVE'
    WHEN 'canceled' THEN 'CANCELLED'
    WHEN 'past_due' THEN 'PAUSED'
    ELSE "planStatus"::text
  END::"SubscriptionPlanStatus_new"
);
ALTER TYPE "SubscriptionPlanStatus" RENAME TO "SubscriptionPlanStatus_old";
ALTER TYPE "SubscriptionPlanStatus_new" RENAME TO "SubscriptionPlanStatus";
DROP TYPE "public"."SubscriptionPlanStatus_old";
ALTER TABLE "users" ALTER COLUMN "planStatus" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "VehicleType_new" AS ENUM ('CAR', 'MOTORCYCLE');
ALTER TABLE "public"."vehicles" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "vehicles" ALTER COLUMN "type" TYPE "VehicleType_new" USING (
  CASE "type"::text
    WHEN 'MOTORCYCLE' THEN 'MOTORCYCLE'
    ELSE 'CAR'
  END::"VehicleType_new"
);
ALTER TABLE "checklist_templates" ALTER COLUMN "vehicleType" TYPE "VehicleType_new" USING (
  CASE "vehicleType"::text
    WHEN 'MOTORCYCLE' THEN 'MOTORCYCLE'
    ELSE 'CAR'
  END::"VehicleType_new"
);
ALTER TYPE "VehicleType" RENAME TO "VehicleType_old";
ALTER TYPE "VehicleType_new" RENAME TO "VehicleType";
DROP TYPE "public"."VehicleType_old";
ALTER TABLE "vehicles" ALTER COLUMN "type" SET DEFAULT 'CAR';
COMMIT;

-- DropIndex
DROP INDEX "checklist_template_items_templateId_idx";

-- DropIndex
DROP INDEX "checklist_templates_vehicleType_idx";

-- AlterTable
ALTER TABLE "checklist_template_items" ALTER COLUMN "category" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "evaluation_checklist_items" ALTER COLUMN "category" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "plan" SET DEFAULT 'FREE',
ALTER COLUMN "planStatus" SET DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "checklist_template_items_templateId_order_idx" ON "checklist_template_items"("templateId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_template_items_templateId_name_key" ON "checklist_template_items"("templateId", "name");

-- CreateIndex
CREATE INDEX "checklist_templates_vehicleType_isActive_idx" ON "checklist_templates"("vehicleType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_templates_vehicleType_name_key" ON "checklist_templates"("vehicleType", "name");
