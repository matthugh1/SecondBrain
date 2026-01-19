'use client'

import { useState, useEffect } from 'react'
import type { Comment } from '@/lib/db/repositories/comments'

interface CommentsProps {
  itemType: string
  itemId: number
  fieldKey?: string
  defaultOpen?: boolean
}

export default function Comments({ itemType, itemId, fieldKey, defaultOpen = false }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const fetchComments = async () => {
    setLoading(true)
    try {
      const url = fieldKey
        ? `/api/comments?itemType=${itemType}&itemId=${itemId}&fieldKey=${fieldKey}`
        : `/api/comments?itemType=${itemType}&itemId=${itemId}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (err) {
      console.error('Error fetching comments:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [itemType, itemId, fieldKey])

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setSaving(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_type: itemType,
          item_id: itemId,
          field_key: fieldKey || null,
          content: newComment,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      setNewComment('')
      await fetchComments()
    } catch (err) {
      console.error('Error adding comment:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateComment = async (id: number) => {
    if (!editContent.trim()) return

    setSaving(true)
    try {
      const response = await fetch(`/api/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      })

      if (!response.ok) {
        throw new Error('Failed to update comment')
      }

      setEditingId(null)
      setEditContent('')
      await fetchComments()
    } catch (err) {
      console.error('Error updating comment:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteComment = async (id: number) => {
    if (!confirm('Delete this comment?')) return

    try {
      const response = await fetch(`/api/comments/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete comment')
      }

      await fetchComments()
    } catch (err) {
      console.error('Error deleting comment:', err)
    }
  }

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id!)
    setEditContent(comment.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const label = fieldKey ? fieldKey.replace(/_/g, ' ') : 'item'
  const buttonLabel = fieldKey ? `Comments` : 'Comments'
  const countLabel = loading ? '' : ` (${comments.length})`

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {buttonLabel}
          <span className="text-xs text-gray-500 dark:text-gray-400">{countLabel}</span>
        </button>
        {fieldKey && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {label}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4 bg-white dark:bg-gray-800">
          {/* Add Comment Form */}
          <div className="space-y-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim() || saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Comment'}
            </button>
          </div>

          {/* Comments List */}
          {loading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">Loading comments...</div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  {editingId === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateComment(comment.id!)}
                          disabled={saving}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                            {comment.content}
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{comment.author || 'User'}</span>
                            <span>•</span>
                            <span>
                              {comment.created_at
                                ? new Date(comment.created_at).toLocaleString()
                                : 'Unknown date'}
                            </span>
                            {comment.field_key && (
                              <>
                                <span>•</span>
                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                                  {comment.field_key}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => startEdit(comment)}
                            className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => comment.id && handleDeleteComment(comment.id)}
                            className="px-2 py-1 text-xs text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
