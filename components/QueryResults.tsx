'use client'

import Link from 'next/link'
import type { Category } from '@/types'

export interface QueryResult {
  item_type: Category
  item_id: number
  title: string
  content: string
  relevance_score: number
  database: Category
}

interface QueryResultsProps {
  results: QueryResult[]
  query: string
  total_results: number
}

export default function QueryResults({ results, query, total_results }: QueryResultsProps) {
  if (results.length === 0) {
    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">
          No results found for &quot;{query}&quot;
        </p>
      </div>
    )
  }

  // Group results by database type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.database]) {
      acc[result.database] = []
    }
    acc[result.database].push(result)
    return acc
  }, {} as Record<Category, QueryResult[]>)

  const databaseLabels: Record<Category, string> = {
    people: 'People',
    projects: 'Projects',
    ideas: 'Ideas',
    admin: 'Admin Tasks',
  }

  return (
    <div className="mt-4">
      <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
        Found {total_results} result{total_results !== 1 ? 's' : ''} for &quot;{query}&quot;
      </div>
      
      <div className="space-y-4">
        {Object.entries(groupedResults).map(([database, items]) => (
          <div key={database} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 capitalize">
              {databaseLabels[database as Category]} ({items.length})
            </h3>
            <div className="space-y-2">
              {items.map((item) => (
                <Link
                  key={`${item.item_type}-${item.item_id}`}
                  href={`/${item.item_type}/${item.item_id}`}
                  className="block p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white mb-1">
                        {item.title}
                      </div>
                      {item.content && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {item.content}
                        </div>
                      )}
                    </div>
                    <div className="ml-4 text-xs text-gray-500 dark:text-gray-400">
                      {Math.round(item.relevance_score * 100)}% match
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
