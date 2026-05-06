-- CreateIndex
CREATE INDEX "vehicles_userId_idx" ON "vehicles"("userId");

-- CreateIndex
CREATE INDEX "vehicles_userId_status_idx" ON "vehicles"("userId", "status");

-- CreateIndex
CREATE INDEX "vehicles_userId_createdAt_idx" ON "vehicles"("userId", "createdAt");
