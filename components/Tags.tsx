'use client'

import { useState, useEffect } from 'react'
import type { Category } from '@/types'

interface Tag {
  id: number
  name: string
}

interface TagsProps {
  itemType: Category
  itemId: number
  onTagsChange?: () => void
}

export default function Tags({ itemType, itemId, onTagsChange }: TagsProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!itemId) {
    return null
  }

  useEffect(() => {
    if (itemId) {
      fetchTags()
      fetchAvailableTags()
    }
  }, [itemType, itemId])

  const fetchTags = () => {
    if (!itemId) return
    fetch(`/api/tags/${itemType}/${itemId}`)
      .then((res) => res.json())
      .then((data) => {
        setTags(data.tags || [])
      })
      .catch((err) => {
        console.error('Error fetching tags:', err)
      })
  }

  const fetchAvailableTags = () => {
    fetch('/api/tags')
      .then((res) => res.json())
      .then((data) => {
        setAvailableTags(data.tags || [])
      })
      .catch((err) => {
        console.error('Error fetching available tags:', err)
      })
  }

  const addTag = async (tagName: string) => {
    if (!tagName.trim()) return

    setLoading(true)
    try {
      // First, ensure tag exists
      await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName.trim() }),
      })

      // Then add to item
      const currentTags = tags.map(t => t.name)
      await fetch(`/api/tags/${itemType}/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: [...currentTags, tagName.trim()] }),
      })

      fetchTags()
      fetchAvailableTags()
      setNewTagName('')
      setShowAdd(false)
      if (onTagsChange) onTagsChange()
    } catch (error) {
      console.error('Error adding tag:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeTag = async (tagId: number) => {
    setLoading(true)
    try {
      const currentTags = tags.filter(t => t.id !== tagId).map(t => t.name)
      await fetch(`/api/tags/${itemType}/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: currentTags }),
      })

      fetchTags()
      if (onTagsChange) onTagsChange()
    } catch (error) {
      console.error('Error removing tag:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAvailableTags = availableTags.filter(
    tag => !tags.some(t => t.id === tag.id)
  )

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 flex-wrap">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-sm font-medium"
          >
            {tag.name}
            <button
              onClick={() => removeTag(tag.id)}
              disabled={loading}
              className="hover:text-primary/80 transition-colors"
            >
              ×
            </button>
          </span>
        ))}
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="px-3 py-1 text-sm border border-border/60 rounded-full text-textMuted hover:bg-surfaceElevated transition-all"
          >
            + Add Tag
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addTag(newTagName)
                } else if (e.key === 'Escape') {
                  setShowAdd(false)
                  setNewTagName('')
                }
              }}
              placeholder="Tag name..."
              className="px-3 py-1 text-sm border border-border/60 rounded-full bg-surface text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              autoFocus
            />
            <button
              onClick={() => addTag(newTagName)}
              disabled={loading}
              className="px-3 py-1 text-sm bg-primary text-textPrimary rounded-full hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-medium"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAdd(false)
                setNewTagName('')
              }}
              className="px-3 py-1 text-sm text-textMuted hover:text-textPrimary transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      {showAdd && filteredAvailableTags.length > 0 && (
        <div className="mt-2 p-2 bg-surfaceElevated border border-border/60 rounded-lg">
          <div className="text-xs text-textMuted mb-1">Or select existing:</div>
          <div className="flex flex-wrap gap-1">
            {filteredAvailableTags.slice(0, 10).map((tag) => (
              <button
                key={tag.id}
                onClick={() => addTag(tag.name)}
                className="px-2 py-0.5 text-xs border border-border/60 rounded text-textMuted hover:bg-surface hover:text-textPrimary transition-all"
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
