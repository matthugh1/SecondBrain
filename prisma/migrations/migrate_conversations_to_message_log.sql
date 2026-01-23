-- Migration script to flatten conversations into message log
-- This script migrates existing ConversationMessage data to the new MessageLog format

-- Step 1: Create message_logs table if it doesn't exist (Prisma will handle this)
-- This is just for reference - Prisma migrations should be run separately

-- Step 2: Migrate existing conversation_messages to message_logs
INSERT INTO message_logs (tenant_id, user_id, role, content, timestamp, created_at, updated_at)
SELECT 
  cm.tenant_id,
  c.user_id,
  cm.role,
  cm.content,
  cm.timestamp,
  cm.timestamp as created_at,
  cm.timestamp as updated_at
FROM conversation_messages cm
INNER JOIN conversations c ON cm.conversation_id = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM message_logs ml 
  WHERE ml.tenant_id = cm.tenant_id 
  AND ml.user_id = c.user_id 
  AND ml.content = cm.content 
  AND ml.timestamp = cm.timestamp
);

-- Step 3: After verifying migration, drop old tables (run manually after verification)
-- DROP TABLE IF EXISTS conversation_entities;
-- DROP TABLE IF EXISTS conversation_messages;
-- DROP TABLE IF EXISTS conversations;
