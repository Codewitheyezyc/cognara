'use client'

import React, { useState, useRef } from 'react'
import { Bold, Italic, Heading2, Heading3, Link2, List, Code, Quote, Eye, Edit3 } from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder = 'Start writing...' }: RichTextEditorProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Simple tag-inserter that wraps selection with HTML tags
  const insertTag = (openTag: string, closeTag: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const selected = text.substring(start, end)
    const replacement = openTag + selected + closeTag

    onChange(text.substring(0, start) + replacement + text.substring(end))

    // Refocus and place cursor back
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + openTag.length,
        start + openTag.length + selected.length
      )
    }, 0)
  }

  const addLink = () => {
    const url = prompt('Enter the link URL (e.g. https://example.com):')
    if (url) {
      insertTag(`<a href="${url}" target="_blank" rel="noopener noreferrer">`, '</a>')
    }
  }

  const toolbarItems = [
    { icon: <Bold className="h-4 w-4" />, label: 'Bold', action: () => insertTag('<strong>', '</strong>') },
    { icon: <Italic className="h-4 w-4" />, label: 'Italic', action: () => insertTag('<em>', '</em>') },
    { icon: <Heading2 className="h-4 w-4" />, label: 'H2', action: () => insertTag('<h2>', '</h2>') },
    { icon: <Heading3 className="h-4 w-4" />, label: 'H3', action: () => insertTag('<h3>', '</h3>') },
    { icon: <List className="h-4 w-4" />, label: 'List', action: () => insertTag('<ul>\n  <li>', '</li>\n</ul>') },
    { icon: <Link2 className="h-4 w-4" />, label: 'Link', action: addLink },
    { icon: <Code className="h-4 w-4" />, label: 'Code', action: () => insertTag('<pre><code>', '</code></pre>') },
    { icon: <Quote className="h-4 w-4" />, label: 'Quote', action: () => insertTag('<blockquote>', '</blockquote>') },
  ]

  return (
    <div className="w-full border border-border bg-surface rounded-2xl overflow-hidden focus-within:border-primary/50 transition-colors">
      
      {/* Editor & Preview Header Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/80 bg-surface-alt/40 px-3 py-2 gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {!isPreviewMode && toolbarItems.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={item.action}
              className="p-2 text-text-2 hover:text-text-1 hover:bg-surface-alt rounded-lg transition-colors cursor-pointer"
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
        </div>

        <div className="flex bg-surface-alt p-1 rounded-xl border border-border/60 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setIsPreviewMode(false)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              !isPreviewMode
                ? 'bg-card text-text-1 shadow-xs'
                : 'text-text-2 hover:text-text-1'
            }`}
          >
            <Edit3 className="h-3 w-3" />
            <span>Write</span>
          </button>
          <button
            type="button"
            onClick={() => setIsPreviewMode(true)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isPreviewMode
                ? 'bg-card text-text-1 shadow-xs'
                : 'text-text-2 hover:text-text-1'
            }`}
          >
            <Eye className="h-3 w-3" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Write / Preview panels */}
      <div className="relative min-h-[300px]">
        {isPreviewMode ? (
          <div className="p-6 overflow-y-auto max-h-[500px]">
            {value.trim() ? (
              <div 
                className="prose dark:prose-invert max-w-none text-left"
                dangerouslySetInnerHTML={{ __html: value }}
              />
            ) : (
              <p className="text-text-3 italic text-xs">Nothing to preview yet...</p>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full min-h-[300px] p-6 bg-transparent text-text-1 placeholder-text-3 focus:outline-none resize-y text-sm font-sans leading-relaxed border-0"
          />
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-t border-border/40 bg-surface-alt/25 px-4 py-2.5 text-[10px] text-text-3 font-semibold select-none">
        <span className="text-center sm:text-left leading-relaxed">
          Supports standard HTML tags. Use preview to verify formatting.
        </span>
        <span className="text-center sm:text-right shrink-0">
          {value.length} characters
        </span>
      </div>
    </div>
  )
}
