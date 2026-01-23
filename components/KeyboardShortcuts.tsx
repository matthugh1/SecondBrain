'use client'

import { useEffect, useState } from 'react'
import { getModifierKey } from '@/lib/hooks/useKeyboardShortcuts'

interface KeyboardShortcutsProps {
  isOpen: boolean
  onClose: () => void
}

export default function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  const [modifierKey, setModifierKey] = useState<'Cmd' | 'Ctrl'>('Ctrl')

  useEffect(() => {
    setModifierKey(getModifierKey())
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const shortcuts = [
    { keys: [`${modifierKey}`, 'K'], description: 'Focus navigation search' },
    { keys: [`${modifierKey}`, 'B'], description: 'Toggle navigation sidebar' },
    { keys: [`${modifierKey}`, 'J'], description: 'Toggle chat sidebar' },
    { keys: ['?'], description: 'Show keyboard shortcuts' },
    { keys: ['Esc'], description: 'Close drawers, modals, or clear search' },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-surfaceElevated border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-textPrimary">Keyboard Shortcuts</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-surface transition-colors text-textMuted hover:text-textPrimary"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                >
                  <span className="text-textPrimary">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, keyIndex) => (
                      <span key={keyIndex}>
                        {keyIndex > 0 && <span className="text-textMuted mx-1">+</span>}
                        <kbd className="px-2 py-1 bg-surface border border-border/60 rounded text-xs font-mono text-textPrimary shadow-sm">
                          {key}
                        </kbd>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-textMuted text-center">
                Press <kbd className="px-1.5 py-0.5 bg-surface border border-border/60 rounded text-xs font-mono">Esc</kbd> or click outside to close
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
