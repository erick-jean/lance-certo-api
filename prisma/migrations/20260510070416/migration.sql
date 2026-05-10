-- CreateEnum
CREATE TYPE "ChecklistSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ChecklistItemStatus" AS ENUM ('NOT_CHECKED', 'OK', 'ATTENTION', 'NEEDS_REPAIR', 'NOT_APPLICABLE');

-- CreateTable
CREATE TABLE "checklist_templates" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_template_items" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultEstimatedCost" DECIMAL(12,2),
    "severity" "ChecklistSeverity" NOT NULL DEFAULT 'MEDIUM',
    "requiresQuantity" BOOLEAN NOT NULL DEFAULT false,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_checklist_items" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "templateItemId" TEXT,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ChecklistItemStatus" NOT NULL DEFAULT 'NOT_CHECKED',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "estimatedUnitCost" DECIMAL(12,2),
    "estimatedTotalCost" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "checklist_templates_vehicleType_idx" ON "checklist_templates"("vehicleType");

-- CreateIndex
CREATE INDEX "checklist_template_items_templateId_idx" ON "checklist_template_items"("templateId");

-- CreateIndex
CREATE INDEX "evaluation_checklist_items_evaluationId_idx" ON "evaluation_checklist_items"("evaluationId");

-- CreateIndex
CREATE INDEX "evaluation_checklist_items_templateItemId_idx" ON "evaluation_checklist_items"("templateItemId");

-- AddForeignKey
ALTER TABLE "checklist_template_items" ADD CONSTRAINT "checklist_template_items_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "checklist_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_checklist_items" ADD CONSTRAINT "evaluation_checklist_items_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "vehicle_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_checklist_items" ADD CONSTRAINT "evaluation_checklist_items_templateItemId_fkey" FOREIGN KEY ("templateItemId") REFERENCES "checklist_template_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
