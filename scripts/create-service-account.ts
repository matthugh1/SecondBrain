#!/usr/bin/env tsx
/**
 * Non-interactive script to create a service account for MCP server
 * Usage: tsx scripts/create-service-account.ts [tenant-id]
 */

import { prisma } from '../lib/db'
import { createServiceAccount } from '../lib/db/repositories/service-accounts'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  try {
    const tenantIdArg = process.argv[2]

    // Get tenant
    let tenant
    if (tenantIdArg) {
      tenant = await prisma.tenant.findUnique({
        where: { id: tenantIdArg },
      })
      if (!tenant) {
        console.error(`❌ Tenant not found: ${tenantIdArg}`)
        process.exit(1)
      }
    } else {
      // Get first tenant
      tenant = await prisma.tenant.findFirst({
        orderBy: { createdAt: 'asc' },
      })
      if (!tenant) {
        console.error('❌ No tenants found in database.')
        console.error('   Please register a user first at /auth/register')
        process.exit(1)
      }
    }

    console.log(`📋 Using tenant: ${tenant.name} (${tenant.id})\n`)

    // Create service account
    const serviceAccount = await createServiceAccount({
      tenantId: tenant.id,
      name: 'MCP Server',
      description: 'Service account for MCP server authentication',
    })

    console.log('✅ Service account created!\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('⚠️  IMPORTANT: Save this token immediately!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log(`ID: ${serviceAccount.id}`)
    console.log(`Name: ${serviceAccount.name}`)
    console.log(`Tenant: ${tenant.name}`)
    console.log(`\n🔑 Token:`)
    console.log(`   ${serviceAccount.token}\n`)

    // Update mcp-server/.env.local
    const envLocalPath = path.join(process.cwd(), 'mcp-server', '.env.local')
    const envPath = path.join(process.cwd(), 'mcp-server', '.env')

    // Try .env.local first, then .env
    let targetPath = envLocalPath
    if (!fs.existsSync(envLocalPath)) {
      targetPath = envPath
    }

    let envContent = ''
    if (fs.existsSync(targetPath)) {
      envContent = fs.readFileSync(targetPath, 'utf-8')
    }

    // Remove existing MCP_SERVICE_ACCOUNT_TOKEN and MCP_API_KEY
    envContent = envContent.replace(/^MCP_SERVICE_ACCOUNT_TOKEN=.*$/m, '')
    envContent = envContent.replace(/^MCP_API_KEY=.*$/m, '')
    envContent = envContent.replace(/^#.*Service Account.*$/m, '')
    envContent = envContent.trim()

    // Add new token
    envContent += `\n\n# Service Account Token (created ${new Date().toISOString()})\n`
    envContent += `MCP_SERVICE_ACCOUNT_TOKEN=${serviceAccount.token}\n`

    // Ensure directory exists
    const envDir = path.dirname(targetPath)
    if (!fs.existsSync(envDir)) {
      fs.mkdirSync(envDir, { recursive: true })
    }

    fs.writeFileSync(targetPath, envContent.trim() + '\n')
    console.log(`✅ Updated ${path.relative(process.cwd(), targetPath)}`)
    console.log('\n✨ Setup complete! The MCP server is ready to use.')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
