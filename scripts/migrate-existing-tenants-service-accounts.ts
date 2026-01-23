#!/usr/bin/env tsx
/**
 * Migration script to create service accounts for existing tenants that don't have one
 * Usage: tsx scripts/migrate-existing-tenants-service-accounts.ts
 */

import { prisma } from '../lib/db'
import { generateServiceAccountToken, hashServiceAccountToken } from '../lib/auth/service-account'

async function main() {
  try {
    console.log('🔄 Migrating existing tenants to have service accounts...\n')

    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      include: {
        serviceAccounts: {
          where: {
            name: 'MCP Server',
            revokedAt: null,
          },
        },
      },
    })

    let created = 0
    let skipped = 0

    for (const tenant of tenants) {
      // Check if tenant already has an active MCP Server service account
      if (tenant.serviceAccounts.length > 0) {
        console.log(`⏭️  Skipping ${tenant.name} - already has service account`)
        skipped++
        continue
      }

      // Get the first owner/admin user for this tenant to set as createdBy
      const membership = await prisma.membership.findFirst({
        where: {
          tenantId: tenant.id,
          role: { in: ['owner', 'admin'] },
        },
        orderBy: { createdAt: 'asc' },
      })

      // Create service account
      const token = generateServiceAccountToken()
      const tokenHash = hashServiceAccountToken(token)

      await prisma.serviceAccount.create({
        data: {
          tenantId: tenant.id,
          name: 'MCP Server',
          description: 'Default service account for MCP server authentication (created automatically)',
          tokenHash,
          createdBy: membership?.userId,
        },
      })

      console.log(`✅ Created service account for ${tenant.name}`)
      created++
    }

    console.log(`\n✨ Migration complete!`)
    console.log(`   Created: ${created}`)
    console.log(`   Skipped: ${skipped}`)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
