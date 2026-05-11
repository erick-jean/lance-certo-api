/*
  Warnings:

  - A unique constraint covering the columns `[evaluationId,name,source]` on the table `evaluation_expenses` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "evaluation_expenses_evaluationId_name_source_key" ON "evaluation_expenses"("evaluationId", "name", "source");
