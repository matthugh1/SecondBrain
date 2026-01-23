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
    if (itemId) {
      fetchComments()
    }
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
          className="inline-flex items-center gap-2 text-sm text-secondary hover:text-secondary/80 transition-colors"
        >
          {buttonLabel}
          <span className="text-xs text-textMuted">{countLabel}</span>
        </button>
        {fieldKey && (
          <span className="text-xs text-textMuted">
            {label}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="rounded-xl border border-border/60 p-4 space-y-4 bg-surfaceElevated">
          {/* Add Comment Form */}
          <div className="space-y-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="w-full px-4 py-2.5 bg-surface border border-border/60 rounded-xl text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-y"
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim() || saving}
              className="px-4 py-2 bg-primary text-textPrimary rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 font-medium"
            >
              {saving ? 'Adding...' : 'Add Comment'}
            </button>
          </div>

          {/* Comments List */}
          {loading ? (
            <div className="text-sm text-textMuted">Loading comments...</div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-textMuted">No comments yet</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="border border-border/60 rounded-lg p-4 bg-surface"
                >
                  {editingId === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-surfaceElevated border border-border/60 rounded-xl text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-y"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateComment(comment.id!)}
                          disabled={saving}
                          className="px-3 py-1 text-sm bg-primary text-textPrimary rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 text-sm bg-surface text-textMuted rounded-lg hover:bg-surfaceElevated border border-border/60 transition-all font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-textPrimary whitespace-pre-wrap">
                            {comment.content}
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-textMuted">
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
                                <span className="px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded">
                                  {comment.field_key}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => startEdit(comment)}
                            className="px-2 py-1 text-xs text-textMuted hover:text-textPrimary transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => comment.id && handleDeleteComment(comment.id)}
                            className="px-2 py-1 text-xs text-error hover:text-error/80 transition-colors"
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
