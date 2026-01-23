import { NextRequest, NextResponse } from 'next/server'
import { runAlertChecks } from '@/lib/alerts'

/**
 * POST /api/cron/alert-check
 * 
 * Cron job endpoint to run alert checks periodically
 * Requires CRON_SECRET for authentication
 * 
 * Recommended schedule: Every 5 minutes
 */
export async function POST(request: NextRequest) {
  // Verify CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 }
    )
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Run alert checks
    runAlertChecks()
    
    return NextResponse.json({
      success: true,
      message: 'Alert checks completed',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error running alert checks:', error)
    return NextResponse.json(
      { error: 'Failed to run alert checks' },
      { status: 500 }
    )
  }
}
