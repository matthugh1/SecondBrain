/**
 * Migration script to migrate conversation data to message log
 * Run with: npx tsx prisma/migrate-data.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateConversationsToMessageLog() {
  console.log('Starting migration from conversations to message log...')

  try {
    // First, ensure message_logs table exists (it should after schema push)
    // Get all conversation messages
    const conversationMessages = await prisma.$queryRaw<any[]>`
      SELECT 
        cm.id,
        cm.tenant_id,
        c.user_id,
        cm.role,
        cm.content,
        cm.timestamp
      FROM conversation_messages cm
      INNER JOIN conversations c ON cm.conversation_id = c.id
      ORDER BY cm.timestamp ASC
    `

    console.log(`Found ${conversationMessages.length} conversation messages to migrate`)

    // Migrate each message
    let migrated = 0
    for (const msg of conversationMessages) {
      try {
        await prisma.$executeRaw`
          INSERT INTO message_logs (tenant_id, user_id, role, content, timestamp, created_at, updated_at)
          VALUES (${msg.tenant_id}, ${msg.user_id}, ${msg.role}, ${msg.content}, ${msg.timestamp}, ${msg.timestamp}, ${msg.timestamp})
          ON CONFLICT DO NOTHING
        `
        migrated++
      } catch (error) {
        console.error(`Error migrating message ${msg.id}:`, error)
      }
    }

    console.log(`Successfully migrated ${migrated} messages to message_logs`)
    console.log('Migration complete! You can now run: npx prisma db push --accept-data-loss')
  } catch (error) {
    console.error('Migration error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateConversationsToMessageLog()
