'use client'

import { useState } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  onSave?: (value: string) => Promise<void>
  placeholder?: string
  className?: string
}

export default function RichTextEditor({
  value,
  onChange,
  onSave,
  placeholder = 'Enter markdown text...',
  className = '',
}: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true)
      try {
        await onSave(value)
      } catch (error) {
        console.error('Error saving:', error)
      } finally {
        setIsSaving(false)
      }
    }
  }

  const renderMarkdown = (text: string): string => {
    // Basic markdown rendering without external dependencies
    let html = text
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/__(.*?)__/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/_(.*?)_/gim, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>')
      // Code blocks
      .replace(/```([^`]+)```/gim, '<pre class="bg-gray-100 dark:bg-gray-800 p-2 rounded"><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/gim, '<code class="bg-gray-100 dark:bg-gray-800 px-1 rounded">$1</code>')
      // Lists
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      // Line breaks
      .replace(/\n/gim, '<br />')

    // Wrap list items in ul tags
    html = html.replace(/(<li>.*<\/li>)/gim, '<ul class="list-disc list-inside">$1</ul>')

    return html
  }

  return (
    <div className={`border border-gray-300 dark:border-gray-600 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={`px-3 py-1 text-sm rounded ${
              isPreview
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {isPreview ? 'Edit' : 'Preview'}
          </button>
          {!isPreview && (
            <div className="flex gap-1">
              <button
                onClick={() => {
                  const textarea = document.querySelector('textarea') as HTMLTextAreaElement
                  if (textarea) {
                    const start = textarea.selectionStart
                    const end = textarea.selectionEnd
                    const selectedText = value.substring(start, end)
                    const newValue = value.substring(0, start) + `**${selectedText}**` + value.substring(end)
                    onChange(newValue)
                    setTimeout(() => {
                      textarea.focus()
                      textarea.setSelectionRange(start + 2, end + 2)
                    }, 0)
                  }
                }}
                className="px-2 py-1 text-sm bg-white dark:bg-gray-900 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Bold"
              >
                <strong>B</strong>
              </button>
              <button
                onClick={() => {
                  const textarea = document.querySelector('textarea') as HTMLTextAreaElement
                  if (textarea) {
                    const start = textarea.selectionStart
                    const end = textarea.selectionEnd
                    const selectedText = value.substring(start, end)
                    const newValue = value.substring(0, start) + `*${selectedText}*` + value.substring(end)
                    onChange(newValue)
                    setTimeout(() => {
                      textarea.focus()
                      textarea.setSelectionRange(start + 1, end + 1)
                    }, 0)
                  }
                }}
                className="px-2 py-1 text-sm bg-white dark:bg-gray-900 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Italic"
              >
                <em>I</em>
              </button>
              <button
                onClick={() => {
                  const textarea = document.querySelector('textarea') as HTMLTextAreaElement
                  if (textarea) {
                    const start = textarea.selectionStart
                    const newValue = value.substring(0, start) + '- ' + value.substring(start)
                    onChange(newValue)
                    setTimeout(() => {
                      textarea.focus()
                      textarea.setSelectionRange(start + 2, start + 2)
                    }, 0)
                  }
                }}
                className="px-2 py-1 text-sm bg-white dark:bg-gray-900 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                title="List"
              >
                •
              </button>
            </div>
          )}
        </div>
        {onSave && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>

      {/* Editor/Preview */}
      {isPreview ? (
        <div
          className="p-4 min-h-[200px] prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(value || '') }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 min-h-[200px] border-0 focus:outline-none dark:bg-gray-900 dark:text-white resize-y"
        />
      )}
    </div>
  )
}
