import { NextRequest, NextResponse } from 'next/server'
import { generateWeeklyReview } from '@/lib/services/digest'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret if configured
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      select: { id: true },
    })

    // Generate review for each tenant
    const results = await Promise.allSettled(
      tenants.map((tenant) => generateWeeklyReview(tenant.id))
    )

    const successCount = results.filter((r) => r.status === 'fulfilled').length
    const failureCount = results.filter((r) => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      message: `Weekly review generated for ${successCount} tenant(s)`,
      successCount,
      failureCount,
    })
  } catch (error) {
    console.error('Error in weekly review cron:', error)
    return NextResponse.json(
      { error: 'Failed to generate weekly review' },
      { status: 500 }
    )
  }
}

// Also support POST for Vercel Cron
export async function POST(request: NextRequest) {
  return GET(request)
}
