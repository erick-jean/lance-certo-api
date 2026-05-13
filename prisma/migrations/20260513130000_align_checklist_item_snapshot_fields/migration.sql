ALTER TABLE "checklist_template_items"
  ADD COLUMN IF NOT EXISTS "question" VARCHAR(255);

ALTER TABLE "evaluation_checklist_items"
  ADD COLUMN IF NOT EXISTS "question" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "severity" "ChecklistSeverity" NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN IF NOT EXISTS "requiresQuantity" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "answeredAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "evaluation_checklist_items_evaluationId_templateItemId_key"
  ON "evaluation_checklist_items"("evaluationId", "templateItemId");

CREATE INDEX IF NOT EXISTS "evaluation_checklist_items_evaluationId_status_idx"
  ON "evaluation_checklist_items"("evaluationId", "status");

CREATE INDEX IF NOT EXISTS "evaluation_checklist_items_evaluationId_order_idx"
  ON "evaluation_checklist_items"("evaluationId", "order");
