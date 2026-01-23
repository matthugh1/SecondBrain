import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { runAlertChecks } from '@/lib/alerts'
import { handleError } from '@/lib/middleware/error-handler'

/**
 * POST /api/alerts/check
 * 
 * Manually trigger alert checks
 * Requires authentication
 * 
 * This endpoint can be called by:
 * - Cron jobs (with CRON_SECRET)
 * - Monitoring systems
 * - Manual testing
 */
export async function POST(request: NextRequest) {
  try {
    // Check for CRON_SECRET (for automated calls)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      // Automated call from cron job
      runAlertChecks()
      return NextResponse.json({ success: true, message: 'Alert checks completed' })
    }

    // Otherwise require tenant authentication
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }

    runAlertChecks()
    return NextResponse.json({ success: true, message: 'Alert checks completed' })
  } catch (error) {
    return handleError(error, '/api/alerts/check')
  }
}
