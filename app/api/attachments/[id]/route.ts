import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { getAttachmentById, deleteAttachment } from '@/lib/db/repositories/attachments'
import { requireTenant } from '@/lib/auth/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const id = parseInt(params.id)
    const attachment = await getAttachmentById(tenantId, id)

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    if (!existsSync(attachment.filepath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const fileBuffer = await readFile(attachment.filepath)
    const headers = new Headers()
    headers.set('Content-Type', attachment.mime_type || 'application/octet-stream')
    headers.set('Content-Disposition', `attachment; filename="${attachment.filename}"`)

    return new NextResponse(fileBuffer, { headers })
  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const id = parseInt(params.id)
    const attachment = await getAttachmentById(tenantId, id)

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Delete file from filesystem
    if (existsSync(attachment.filepath)) {
      const { unlink } = await import('fs/promises')
      await unlink(attachment.filepath)
    }

    // Delete from database
    await deleteAttachment(tenantId, id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json(
      { error: 'Failed to delete attachment' },
      { status: 500 }
    )
  }
}
