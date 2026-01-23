import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding calendar events...')

  // Get all tenants
  const tenants = await prisma.tenant.findMany()
  
  if (tenants.length === 0) {
    console.log('No tenants found, creating default tenant...')
    const defaultTenant = await prisma.tenant.create({
      data: {
        name: 'Default Workspace',
      },
    })
    tenants.push(defaultTenant)
  }

  console.log(`Found ${tenants.length} tenant(s). Seeding events for all tenants...`)

  // Get current time for creating realistic demo data
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  // Create demo calendar events
  const events = [
    // Past meetings (yesterday)
    {
      subject: 'Team Standup',
      startTime: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // Yesterday 9 AM
      endTime: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000 + 30 * 60 * 1000), // Yesterday 9:30 AM
      location: 'Microsoft Teams',
      attendees: 'John, Sarah, Mike, Emma',
      description: 'Daily team sync and status updates',
      isAllDay: false,
    },
    {
      subject: '1:1 with Sarah',
      startTime: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), // Yesterday 2 PM
      endTime: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000 + 30 * 60 * 1000), // Yesterday 2:30 PM
      location: 'Microsoft Teams',
      attendees: 'Sarah',
      description: 'Weekly one-on-one check-in',
      isAllDay: false,
    },
    
    // Today's meetings
    {
      subject: 'Project Review - Q4 Planning',
      startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000), // Today 10 AM
      endTime: new Date(today.getTime() + 10 * 60 * 60 * 1000 + 60 * 60 * 1000), // Today 11 AM
      location: 'Microsoft Teams',
      attendees: 'John, Sarah, Mike, Emma, David',
      description: 'Review Q4 project status and plan next quarter',
      isAllDay: false,
    },
    {
      subject: 'Client Call - Acme Corp',
      startTime: new Date(today.getTime() + 13 * 60 * 60 * 1000), // Today 1 PM
      endTime: new Date(today.getTime() + 13 * 60 * 60 * 1000 + 45 * 60 * 1000), // Today 1:45 PM
      location: 'Microsoft Teams',
      attendees: 'John, Sarah',
      description: 'Quarterly business review with Acme Corp',
      isAllDay: false,
    },
    {
      subject: 'Sprint Planning',
      startTime: new Date(today.getTime() + 15 * 60 * 60 * 1000), // Today 3 PM
      endTime: new Date(today.getTime() + 15 * 60 * 60 * 1000 + 90 * 60 * 1000), // Today 4:30 PM
      location: 'Conference Room A',
      attendees: 'Mike, Emma, David, Sarah',
      description: 'Plan next sprint goals and tasks',
      isAllDay: false,
    },
    
    // Current meeting (if current time is between 2 PM and 3 PM)
    {
      subject: 'Team Standup',
      startTime: new Date(today.getTime() + 14 * 60 * 60 * 1000), // Today 2 PM
      endTime: new Date(today.getTime() + 14 * 60 * 60 * 1000 + 30 * 60 * 1000), // Today 2:30 PM
      location: 'Microsoft Teams',
      attendees: 'John, Sarah, Mike',
      description: 'Daily team sync',
      isAllDay: false,
    },
    
    // Tomorrow's meetings
    {
      subject: 'All-Hands Meeting',
      startTime: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // Tomorrow 10 AM
      endTime: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000 + 60 * 60 * 1000), // Tomorrow 11 AM
      location: 'Microsoft Teams',
      attendees: 'All Team',
      description: 'Company-wide all-hands meeting',
      isAllDay: false,
    },
    {
      subject: '1:1 with Mike',
      startTime: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), // Tomorrow 2 PM
      endTime: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000 + 30 * 60 * 1000), // Tomorrow 2:30 PM
      location: 'Microsoft Teams',
      attendees: 'Mike',
      description: 'Weekly one-on-one',
      isAllDay: false,
    },
    
    // Next week's meetings
    {
      subject: 'Product Demo',
      startTime: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), // Next week Monday 11 AM
      endTime: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000 + 60 * 60 * 1000), // Next week Monday 12 PM
      location: 'Microsoft Teams',
      attendees: 'John, Sarah, Mike, Emma, David, External Stakeholders',
      description: 'Demo new product features to stakeholders',
      isAllDay: false,
    },
    {
      subject: 'Workshop: Design Thinking',
      startTime: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000), // Next week Monday 1 PM
      endTime: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // Next week Monday 4 PM
      location: 'Conference Room B',
      attendees: 'Sarah, Mike, Emma',
      description: 'Design thinking workshop for product team',
      isAllDay: false,
    },
  ]

  // Seed events for each tenant
  let totalCreated = 0
  
  for (const tenant of tenants) {
    // Check if events already exist for this tenant
    const existingCount = await prisma.calendarEvent.count({
      where: { tenantId: tenant.id },
    })

    if (existingCount > 0) {
      console.log(`Tenant ${tenant.id} (${tenant.name}): Found ${existingCount} existing events. Skipping.`)
      continue
    }

    // Create events for this tenant
    for (const event of events) {
      await prisma.calendarEvent.create({
        data: {
          tenantId: tenant.id,
          ...event,
        },
      })
    }
    
    totalCreated += events.length
    console.log(`✅ Created ${events.length} calendar events for tenant ${tenant.id} (${tenant.name})`)
  }

  if (totalCreated > 0) {
    console.log(`📅 Demo calendar data seeded successfully! Total events created: ${totalCreated}`)
  } else {
    console.log('📅 All tenants already have calendar events. No new events created.')
  }
}

main()
  .catch((e) => {
    console.error('Error seeding calendar:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
