'use client'

import { useState, useEffect, useRef } from 'react'
import type { Attachment } from '@/lib/db/repositories/attachments'

interface AttachmentsProps {
  itemType: string
  itemId: number
}

export default function Attachments({ itemType, itemId }: AttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchAttachments = async () => {
    try {
      const response = await fetch(`/api/attachments?itemType=${itemType}&itemId=${itemId}`)
      if (response.ok) {
        const data = await response.json()
        setAttachments(data)
      }
    } catch (err) {
      console.error('Error fetching attachments:', err)
    }
  }

  useEffect(() => {
    fetchAttachments()
  }, [itemType, itemId])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('itemType', itemType)
    formData.append('itemId', itemId.toString())

    try {
      const response = await fetch('/api/attachments/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      await fetchAttachments()
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this attachment?')) return

    try {
      const response = await fetch(`/api/attachments/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      await fetchAttachments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes) return 'Unknown'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isImage = (mimeType: string | null | undefined): boolean => {
    return mimeType?.startsWith('image/') || false
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Attachments</h3>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer inline-block ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </label>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
          {error}
        </div>
      )}

      {attachments.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No attachments</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              {isImage(attachment.mime_type) && attachment.id ? (
                <div className="mb-2">
                  <img
                    src={`/api/attachments/${attachment.id}`}
                    alt={attachment.filename}
                    className="w-full h-32 object-cover rounded"
                  />
                </div>
              ) : (
                <div className="mb-2 h-32 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                  <span className="text-4xl">📎</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={attachment.filename}>
                    {attachment.filename}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(attachment.size)}
                  </p>
                </div>
                <div className="flex gap-2 ml-2">
                  <a
                    href={`/api/attachments/${attachment.id}`}
                    download={attachment.filename}
                    className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => attachment.id && handleDelete(attachment.id)}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
