'use client'

import { useState } from 'react'
import type { Category } from '@/types'

interface ManualRelationshipProps {
  itemType: Category
  itemId: number
  onRelationshipCreated?: () => void
}

export default function ManualRelationship({ itemType, itemId, onRelationshipCreated }: ManualRelationshipProps) {
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ type: Category; id: number; name: string }>>([])
  const [selectedTarget, setSelectedTarget] = useState<{ type: Category; id: number; name: string } | null>(null)
  const [relationshipType, setRelationshipType] = useState('related_to')
  const [loading, setLoading] = useState(false)

  const relationshipTypes = [
    { value: 'mentioned_in', label: 'Mentioned In' },
    { value: 'related_to', label: 'Related To' },
    { value: 'blocks', label: 'Blocks' },
    { value: 'depends_on', label: 'Depends On' },
    { value: 'part_of', label: 'Part Of' },
  ]

  const searchItems = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      // Search across all databases
      const [peopleRes, projectsRes, ideasRes, adminRes] = await Promise.all([
        fetch(`/api/people?q=${encodeURIComponent(query)}`).catch(() => null),
        fetch(`/api/projects?q=${encodeURIComponent(query)}`).catch(() => null),
        fetch(`/api/ideas?q=${encodeURIComponent(query)}`).catch(() => null),
        fetch(`/api/admin?q=${encodeURIComponent(query)}`).catch(() => null),
      ])

      const results: Array<{ type: Category; id: number; name: string }> = []

      // Parse responses (simplified - adjust based on your API structure)
      // For now, we'll use a simpler approach - search by name in each database
      const searchInDatabase = async (type: Category, endpoint: string) => {
        try {
          const response = await fetch(`/api/${type}`)
          if (response.ok) {
            const data = await response.json()
            const items = Array.isArray(data) ? data : (data.items || [])
            return items
              .filter((item: any) => 
                item.name && item.name.toLowerCase().includes(query.toLowerCase())
              )
              .map((item: any) => ({
                type,
                id: item.id,
                name: item.name,
              }))
          }
        } catch (error) {
          console.error(`Error searching ${type}:`, error)
        }
        return []
      }

      const [people, projects, ideas, admin] = await Promise.all([
        searchInDatabase('people', '/api/people'),
        searchInDatabase('projects', '/api/projects'),
        searchInDatabase('ideas', '/api/ideas'),
        searchInDatabase('admin', '/api/admin'),
      ])

      // Filter out the current item
      const filtered = [...people, ...projects, ...ideas, ...admin].filter(
        item => !(item.type === itemType && item.id === itemId)
      )

      setSearchResults(filtered.slice(0, 10))
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    searchItems(query)
  }

  const handleCreateRelationship = async () => {
    if (!selectedTarget) return

    setLoading(true)
    try {
      const response = await fetch(`/api/relationships/${itemType}/${itemId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: selectedTarget.type,
          targetId: selectedTarget.id,
          relationshipType,
        }),
      })

      if (response.ok) {
        setShowModal(false)
        setSearchQuery('')
        setSearchResults([])
        setSelectedTarget(null)
        if (onRelationshipCreated) {
          onRelationshipCreated()
        }
      } else {
        alert('Failed to create relationship')
      }
    } catch (error) {
      console.error('Error creating relationship:', error)
      alert('Error creating relationship')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Link to...
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Create Relationship
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Search for item to link:
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Type to search..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {loading && <div className="text-sm text-gray-500 mt-1">Searching...</div>}
            </div>

            {searchResults.length > 0 && (
              <div className="mb-4 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                {searchResults.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => setSelectedTarget(item)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      selectedTarget?.type === item.type && selectedTarget?.id === item.id
                        ? 'bg-blue-100 dark:bg-blue-900'
                        : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{item.type}</div>
                  </button>
                ))}
              </div>
            )}

            {selectedTarget && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Relationship Type:
                </label>
                <select
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {relationshipTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowModal(false)
                  setSearchQuery('')
                  setSearchResults([])
                  setSelectedTarget(null)
                }}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRelationship}
                disabled={!selectedTarget || loading}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Create Link
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
