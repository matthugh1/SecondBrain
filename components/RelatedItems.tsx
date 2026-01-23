'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Category } from '@/types'

interface RelatedItem {
  itemType: Category
  itemId: number
  name: string
  relationshipType: string
  strength: number
  mentionCount: number
}

interface RelatedItemsProps {
  itemType: Category
  itemId: number
}

export default function RelatedItems({ itemType, itemId }: RelatedItemsProps) {
  const [related, setRelated] = useState<RelatedItem[]>([])
  const [loading, setLoading] = useState(true)

  if (!itemId) {
    return null
  }

  useEffect(() => {
    if (!itemId) {
      setLoading(false)
      return
    }
    // Try relationships API first, fall back to tag-based if no relationships
    fetch(`/api/relationships/${itemType}/${itemId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.related && data.related.length > 0) {
          setRelated(data.related)
          setLoading(false)
        } else {
          // Fall back to tag-based relationships
          return fetch(`/api/related/${itemType}/${itemId}`)
        }
      })
      .then((res) => {
        if (res) {
          return res.json()
        }
        return null
      })
      .then((data) => {
        if (data && data.related) {
          // Convert tag-based format to relationship format
          const converted = data.related.map((item: any) => ({
            itemType: item.item_type,
            itemId: item.item_id,
            name: item.name,
            relationshipType: 'tagged_with',
            strength: item.shared_count / 10, // Normalize to 0-1
            mentionCount: item.shared_count,
          }))
          setRelated(converted)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching related items:', err)
        setLoading(false)
      })
  }, [itemType, itemId])

  if (loading) {
    return null
  }

  if (related.length === 0) {
    return null
  }

  return (
    <div className="mt-6 pt-6 border-t border-border/60">
      <h3 className="text-lg font-bold text-textPrimary mb-3">
        Related Items
      </h3>
      <div className="space-y-2">
        {related.map((item) => (
          <Link
            key={`${item.itemType}-${item.itemId}`}
            href={`/${item.itemType}/${item.itemId}`}
            className="block p-3 border border-border/60 rounded-lg bg-surfaceElevated hover:bg-surface transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-textPrimary hover:text-primary transition-colors">
                  {item.name}
                </div>
                <div className="text-sm text-textMuted capitalize">
                  {item.itemType} • {item.relationshipType.replace('_', ' ')}
                </div>
              </div>
              <div className="text-sm text-textMuted">
                {Math.round(item.strength * 100)}% match
              </div>
            </div>
            {item.mentionCount > 1 && (
              <div className="text-xs text-textMuted mt-1">
                Mentioned {item.mentionCount} times
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
