ALTER TABLE "checklist_template_items"
  ADD COLUMN IF NOT EXISTS "isPremiumOnly" BOOLEAN NOT NULL DEFAULT false;
