'use client'

import { useState, useEffect, useRef } from 'react'
import type { Category } from '@/types'

interface FixButtonProps {
  logId: number
  currentCategory: string
  onFixed?: () => void
}

interface RuleCategory {
  id: number
  category_key: string
  label: string
  enabled: number
}

export default function FixButton({ logId, currentCategory, onFixed }: FixButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [categories, setCategories] = useState<Category[]>(['people', 'projects', 'ideas', 'admin']) // Fallback
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  console.log('🔧 FixButton props:', { logId, currentCategory, categoriesCount: categories.length })
  
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect())
    }
  }, [isOpen])

  useEffect(() => {
    // Fetch all categories from the database (for fixing, we want to show all categories)
    fetch('/api/rules/categories')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch categories: ${res.status}`)
        }
        return res.json()
      })
      .then((data: RuleCategory[]) => {
        // Get all categories (not just enabled ones) for fixing
        // Fixing is a manual override, so users should be able to fix to any category
        const allCategories = data.map((cat) => cat.category_key as Category)
        console.log('📋 All categories for fixing:', allCategories)
        if (allCategories.length > 0) {
          setCategories(allCategories)
        } else {
          console.warn('⚠️ No categories found, using fallback')
        }
        setLoadingCategories(false)
      })
      .catch((err) => {
        console.error('❌ Error fetching categories:', err)
        setLoadingCategories(false)
        // Keep fallback categories
      })
  }, [])

  const handleFix = async (newCategory: Category) => {
    if (newCategory === currentCategory.toLowerCase()) {
      setIsOpen(false)
      return
    }

    setIsFixing(true)
    try {
      const response = await fetch('/api/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId, category: newCategory }),
      })

      const result = await response.json()

      if (result.success) {
        setIsOpen(false)
        if (onFixed) {
          onFixed()
        } else {
          // Reload the page to refresh data
          window.location.reload()
        }
      } else {
        alert(`Failed to fix: ${result.message || result.error}`)
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isFixing}
        className="px-3 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800 disabled:opacity-50"
      >
        {isFixing ? 'Fixing...' : 'Fix'}
      </button>

      {isOpen && buttonRect && (() => {
        console.log('📋 Dropdown rendering with categories:', categories, 'currentCategory:', currentCategory, 'buttonRect:', buttonRect)
        return (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div 
              className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[150px] max-h-[300px] overflow-y-auto"
              style={{
                top: `${buttonRect.bottom + 4}px`,
                right: `${window.innerWidth - buttonRect.right}px`,
              }}
            >
            <div className="py-1">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                Change to:
              </div>
              {loadingCategories ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  Loading...
                </div>
              ) : categories.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No categories available
                </div>
              ) : (
                categories.map((category) => {
                  const isCurrentCategory = category === currentCategory.toLowerCase()
                  const isDisabled = isFixing || isCurrentCategory
                  console.log('🔍 Rendering category:', { 
                    category, 
                    currentCategory, 
                    currentCategoryLower: currentCategory.toLowerCase(),
                    isCurrentCategory,
                    isDisabled 
                  })
                  return (
                    <button
                      key={category}
                      onClick={() => handleFix(category)}
                      disabled={isDisabled}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        isCurrentCategory
                          ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                      style={{ display: 'block' }}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </>
        )
      })()}
    </div>
  )
}
