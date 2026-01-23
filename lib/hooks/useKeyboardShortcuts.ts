'use client'

import { useEffect, useCallback } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  handler: (e: KeyboardEvent) => void
  description: string
  preventDefault?: boolean
}

/**
 * Hook to handle keyboard shortcuts
 * @param shortcuts - Array of keyboard shortcut definitions
 * @param enabled - Whether shortcuts are enabled (default: true)
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return

      // Don't trigger shortcuts when user is typing in inputs, textareas, or contenteditable elements
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      for (const shortcut of shortcuts) {
        const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase() || 
                           (shortcut.key === 'Escape' && e.key === 'Escape')
        const ctrlMatches = shortcut.ctrlKey === undefined ? true : (e.ctrlKey || e.metaKey) === shortcut.ctrlKey
        const metaMatches = shortcut.metaKey === undefined ? true : e.metaKey === shortcut.metaKey
        const shiftMatches = shortcut.shiftKey === undefined ? true : e.shiftKey === shortcut.shiftKey
        const altMatches = shortcut.altKey === undefined ? true : e.altKey === shortcut.altKey

        // Special handling for Escape key - don't require ctrl/meta
        const isEscape = shortcut.key === 'Escape' && e.key === 'Escape'
        const modifierMatches = isEscape ? true : (ctrlMatches && metaMatches && shiftMatches && altMatches)

        if (keyMatches && modifierMatches) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault()
          }
          shortcut.handler(e)
          break
        }
      }
    },
    [shortcuts, enabled]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])
}

/**
 * Get platform-specific modifier key label
 */
export function getModifierKey(): 'Cmd' | 'Ctrl' {
  if (typeof window !== 'undefined') {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? 'Cmd' : 'Ctrl'
  }
  return 'Ctrl'
}
