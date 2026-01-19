import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { createAttachment } from '@/lib/db/repositories/attachments'
import { requireTenant } from '@/lib/auth/utils'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const UPLOAD_DIR = './data/uploads'

export async function POST(request: NextRequest) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const itemType = formData.get('itemType') as string
    const itemId = formData.get('itemId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!itemType || !itemId) {
      return NextResponse.json({ error: 'itemType and itemId required' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Create upload directory structure
    const itemDir = path.join(UPLOAD_DIR, itemType, itemId)
    if (!existsSync(itemDir)) {
      await mkdir(itemDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name
    const ext = path.extname(originalName)
    const baseName = path.basename(originalName, ext)
    const sanitizedName = baseName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    const filename = `${sanitizedName}_${timestamp}${ext}`
    const filepath = path.join(itemDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Save to database
    const attachmentId = await createAttachment(tenantId, {
      item_type: itemType,
      item_id: parseInt(itemId),
      filename: originalName,
      filepath: filepath,
      mime_type: file.type || null,
      size: file.size,
    })

    return NextResponse.json({
      id: attachmentId,
      filename: originalName,
      size: file.size,
      mime_type: file.type,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
