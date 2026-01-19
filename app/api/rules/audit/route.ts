import { NextRequest, NextResponse } from 'next/server'
import {
  getClassificationAuditCount,
  getClassificationAuditLogs,
  type ClassificationAuditStatus,
} from '@/lib/db/repositories/classification-audit'

function parseLimit(value: string | null, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(200, Math.max(1, Math.floor(parsed)))
}

function parseOffset(value: string | null): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.floor(parsed))
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const statusParam = searchParams.get('status') || undefined
    const providerParam = searchParams.get('provider') || undefined
    const limit = parseLimit(searchParams.get('limit'), 100)
    const offset = parseOffset(searchParams.get('offset'))

    const status =
      statusParam === 'success' || statusParam === 'error'
        ? (statusParam as ClassificationAuditStatus)
        : undefined

    const provider = providerParam && providerParam.trim().length > 0 ? providerParam : undefined

    const [logs, total] = [
      getClassificationAuditLogs({ status, provider, limit, offset }),
      getClassificationAuditCount({ status, provider }),
    ]

    const normalizedLogs = logs.map(log => ({
      ...log,
      parsed_result: log.parsed_result ? safeParseJson(log.parsed_result) : null,
    }))

    return NextResponse.json({ logs: normalizedLogs, total, limit, offset })
  } catch (error) {
    console.error('Error fetching classification audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch classification audit logs' },
      { status: 500 }
    )
  }
}

function safeParseJson(value: string): Record<string, any> | null {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
