#!/usr/bin/env tsx
/**
 * Setup script to create a service account for MCP server
 * Usage: tsx scripts/setup-service-account.ts [tenant-name]
 */

import { prisma } from '../lib/db'
import { createServiceAccount } from '../lib/db/repositories/service-accounts'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve))
}

async function main() {
  try {
    console.log('🔐 Service Account Setup\n')

    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'asc' },
    })

    if (tenants.length === 0) {
      console.log('❌ No tenants found in database.')
      console.log('   Please register a user first at /auth/register')
      process.exit(1)
    }

    // Select tenant
    let selectedTenant = tenants[0]

    if (tenants.length > 1) {
      console.log('Available tenants:')
      tenants.forEach((tenant, index) => {
        console.log(`  ${index + 1}. ${tenant.name} (${tenant.id})`)
      })

      const answer = await question(
        `\nSelect tenant (1-${tenants.length}) [default: 1]: `
      )
      const index = answer.trim() ? parseInt(answer.trim()) - 1 : 0

      if (index < 0 || index >= tenants.length) {
        console.log('❌ Invalid selection')
        process.exit(1)
      }

      selectedTenant = tenants[index]
    } else {
      console.log(`Using tenant: ${selectedTenant.name}`)
    }

    // Get service account details
    const name =
      (await question('\nService account name [default: MCP Server]: ')) ||
      'MCP Server'
    const description =
      (await question(
        'Description [default: Service account for MCP server authentication]: '
      )) || 'Service account for MCP server authentication'

    // Optional expiration
    const expiresInput = await question(
      'Expiration date (YYYY-MM-DD) or press Enter for no expiration: '
    )
    const expiresAt = expiresInput.trim()
      ? new Date(expiresInput.trim())
      : undefined

    if (expiresAt && isNaN(expiresAt.getTime())) {
      console.log('❌ Invalid date format')
      process.exit(1)
    }

    // Create service account
    console.log('\n⏳ Creating service account...')
    const serviceAccount = await createServiceAccount({
      tenantId: selectedTenant.id,
      name,
      description,
      expiresAt,
    })

    console.log('\n✅ Service account created successfully!\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('⚠️  IMPORTANT: Save this token immediately - it will not be shown again!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log(`Service Account ID: ${serviceAccount.id}`)
    console.log(`Name: ${serviceAccount.name}`)
    console.log(`Tenant: ${selectedTenant.name} (${selectedTenant.id})`)
    if (serviceAccount.expiresAt) {
      console.log(`Expires: ${serviceAccount.expiresAt.toISOString()}`)
    }
    console.log(`\n🔑 Token:`)
    console.log(`   ${serviceAccount.token}\n`)

    // Ask if user wants to update .env file
    const updateEnv = await question(
      'Update mcp-server/.env file with this token? (y/n) [default: n]: '
    )

    if (updateEnv.toLowerCase() === 'y' || updateEnv.toLowerCase() === 'yes') {
      const fs = await import('fs')
      const path = await import('path')

      const envPath = path.join(process.cwd(), 'mcp-server', '.env')
      const envLocalPath = path.join(process.cwd(), 'mcp-server', '.env.local')

      // Try .env.local first, then .env
      let targetPath = envLocalPath
      if (!fs.existsSync(envLocalPath)) {
        targetPath = envPath
      }

      let envContent = ''
      if (fs.existsSync(targetPath)) {
        envContent = fs.readFileSync(targetPath, 'utf-8')
      }

      // Remove existing MCP_SERVICE_ACCOUNT_TOKEN if present
      envContent = envContent.replace(
        /^MCP_SERVICE_ACCOUNT_TOKEN=.*$/m,
        ''
      )
      envContent = envContent.replace(
        /^MCP_API_KEY=.*$/m,
        ''
      )

      // Add new token
      envContent += `\n# Service Account Token (created ${new Date().toISOString()})\n`
      envContent += `MCP_SERVICE_ACCOUNT_TOKEN=${serviceAccount.token}\n`

      fs.writeFileSync(targetPath, envContent.trim() + '\n')
      console.log(`\n✅ Updated ${targetPath}`)
    } else {
      console.log('\n📝 To use this token, set it in your environment:')
      console.log(`   export MCP_SERVICE_ACCOUNT_TOKEN="${serviceAccount.token}"`)
      console.log('\n   Or add it to mcp-server/.env.local:')
      console.log(`   MCP_SERVICE_ACCOUNT_TOKEN=${serviceAccount.token}`)
    }

    console.log('\n✨ Setup complete!')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

main()
