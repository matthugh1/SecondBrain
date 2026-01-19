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

  useEffect(() => {
    fetchTags()
    fetchAvailableTags()
  }, [itemType, itemId])

  const fetchTags = () => {
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
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
          >
            {tag.name}
            <button
              onClick={() => removeTag(tag.id)}
              disabled={loading}
              className="hover:text-blue-600 dark:hover:text-blue-300"
            >
              ×
            </button>
          </span>
        ))}
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
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
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              autoFocus
            />
            <button
              onClick={() => addTag(newTagName)}
              disabled={loading}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAdd(false)
                setNewTagName('')
              }}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      {showAdd && filteredAvailableTags.length > 0 && (
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Or select existing:</div>
          <div className="flex flex-wrap gap-1">
            {filteredAvailableTags.slice(0, 10).map((tag) => (
              <button
                key={tag.id}
                onClick={() => addTag(tag.name)}
                className="px-2 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
