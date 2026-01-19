'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Category } from '@/types'

interface RelatedItem {
  item_type: Category
  item_id: number
  name: string
  shared_tags: string[]
  shared_count: number
}

interface RelatedItemsProps {
  itemType: Category
  itemId: number
}

export default function RelatedItems({ itemType, itemId }: RelatedItemsProps) {
  const [related, setRelated] = useState<RelatedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/related/${itemType}/${itemId}`)
      .then((res) => res.json())
      .then((data) => {
        setRelated(data.related || [])
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
    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
        Related Items
      </h3>
      <div className="space-y-2">
        {related.map((item) => (
          <Link
            key={`${item.item_type}-${item.item_id}`}
            href={`/${item.item_type}/${item.item_id}`}
            className="block p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {item.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {item.item_type}
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {item.shared_count} shared {item.shared_count === 1 ? 'tag' : 'tags'}
              </div>
            </div>
            {item.shared_tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.shared_tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
