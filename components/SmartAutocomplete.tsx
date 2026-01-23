'use client'

import { useState, useEffect, useRef } from 'react'

interface AutocompleteOption {
  id: number | string
  label: string
  type?: string
}

interface SmartAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (option: AutocompleteOption) => void
  placeholder?: string
  entityType?: 'people' | 'projects' | 'tags' | 'categories'
  className?: string
  disabled?: boolean
}

export default function SmartAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Type to search...',
  entityType,
  className = '',
  disabled = false,
}: SmartAutocompleteProps) {
  const [options, setOptions] = useState<AutocompleteOption[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value.trim().length >= 2) {
      fetchOptions(value)
    } else {
      setOptions([])
      setShowDropdown(false)
    }
  }, [value, entityType])

  const fetchOptions = async (query: string) => {
    try {
      const params = new URLSearchParams({ q: query })
      if (entityType) {
        params.append('type', entityType)
      }
      const response = await fetch(`/api/autocomplete?${params}`)
      if (response.ok) {
        const data = await response.json()
        setOptions(data.options || [])
        setShowDropdown(true)
      }
    } catch (error) {
      console.error('Error fetching autocomplete options:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || options.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < options.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < options.length) {
          handleSelect(options[selectedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSelect = (option: AutocompleteOption) => {
    onChange(option.label)
    if (onSelect) {
      onSelect(option)
    }
    setShowDropdown(false)
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (options.length > 0) {
            setShowDropdown(true)
          }
        }}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
      />
      {showDropdown && options.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-surfaceElevated border border-border rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {options.map((option, idx) => (
            <button
              key={`${option.type || 'item'}-${option.id}`}
              type="button"
              onClick={() => handleSelect(option)}
              className={`w-full text-left px-4 py-2 hover:bg-surface transition-colors text-textPrimary ${
                idx === selectedIndex ? 'bg-primary/20' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-textPrimary">{option.label}</span>
                {option.type && (
                  <span className="text-xs text-textMuted capitalize">
                    {option.type}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
