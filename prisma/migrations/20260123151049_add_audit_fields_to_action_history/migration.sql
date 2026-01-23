-- AlterTable
ALTER TABLE "action_history" ADD COLUMN     "details" TEXT,
ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "request_id" TEXT,
ADD COLUMN     "user_agent" TEXT,
ADD COLUMN     "user_id" TEXT;

-- CreateIndex
CREATE INDEX "action_history_tenantId_timestamp_idx" ON "action_history"("tenantId", "timestamp");

-- CreateIndex
CREATE INDEX "action_history_user_id_timestamp_idx" ON "action_history"("user_id", "timestamp");

-- CreateIndex
CREATE INDEX "action_history_action_type_timestamp_idx" ON "action_history"("action_type", "timestamp");

-- CreateIndex
CREATE INDEX "action_history_request_id_idx" ON "action_history"("request_id");
