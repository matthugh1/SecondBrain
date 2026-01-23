'use client'

import { useState, useRef, useEffect } from 'react'

interface InlineEditorProps {
  value: string | number | null | undefined
  onSave: (value: string) => Promise<void>
  type?: 'text' | 'textarea' | 'select' | 'date' | 'datetime-local'
  options?: { value: string; label: string }[]
  className?: string
  placeholder?: string
}

export default function InlineEditor({
  value,
  onSave,
  type = 'text',
  options = [],
  className = '',
  placeholder = '',
}: InlineEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(value || ''))
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null)

  // Format date/datetime values for input fields
  const formatDateForInput = (val: string | number | null | undefined, inputType: 'date' | 'datetime-local'): string => {
    if (!val) return ''
    try {
      const date = new Date(String(val))
      if (isNaN(date.getTime())) return String(val)
      
      if (inputType === 'datetime-local') {
        // Format as YYYY-MM-DDTHH:mm for datetime-local input
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
      } else {
        // Format as YYYY-MM-DD for date input
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
    } catch {
      return String(val)
    }
  }

  // Format date/datetime values for display
  const formatDateForDisplay = (val: string | number | null | undefined, inputType: 'date' | 'datetime-local'): string => {
    if (!val) return '-'
    try {
      const date = new Date(String(val))
      if (isNaN(date.getTime())) return String(val)
      
      if (inputType === 'datetime-local') {
        return date.toLocaleString()
      } else {
        return date.toLocaleDateString()
      }
    } catch {
      return String(val)
    }
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (type === 'text' && inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select()
      }
    }
    // Initialize editValue with properly formatted date/datetime
    if ((type === 'date' || type === 'datetime-local') && value) {
      setEditValue(formatDateForInput(value, type))
    } else {
      setEditValue(String(value || ''))
    }
  }, [isEditing, type, value])

  const handleSave = async () => {
    if (editValue === String(value || '')) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(editValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving:', error)
      // Reset on error
      setEditValue(String(value || ''))
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(String(value || ''))
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && type !== 'textarea') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  if (!isEditing) {
    let displayValue: string
    if ((type === 'date' || type === 'datetime-local') && value) {
      displayValue = formatDateForDisplay(value, type)
    } else {
      displayValue = String(value || placeholder || '-')
    }
    return (
      <div
        onClick={() => setIsEditing(true)}
        className={`cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded ${className}`}
        title="Click to edit"
      >
        {displayValue}
      </div>
    )
  }

  if (type === 'select' && options.length > 0) {
    return (
      <select
        ref={inputRef as React.RefObject<HTMLSelectElement>}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className={`px-4 py-2.5 bg-surface border border-border/60 rounded-xl text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${className}`}
        autoFocus
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  }

  if (type === 'textarea') {
    return (
      <div className="relative">
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          rows={3}
          className={`w-full px-4 py-2.5 bg-surface border border-border/60 rounded-xl text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-y ${className}`}
          autoFocus
        />
        {isSaving && (
          <div className="absolute top-2 right-2 text-xs text-textMuted">Saving...</div>
        )}
      </div>
    )
  }

  // Handle date/datetime-local inputs
  if (type === 'date' || type === 'datetime-local') {
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        className={`px-4 py-2.5 bg-surface border border-border/60 rounded-xl text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${className}`}
        autoFocus
      />
    )
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type={type}
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      disabled={isSaving}
      placeholder={placeholder}
      className={`px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${className}`}
      autoFocus
    />
  )
}
