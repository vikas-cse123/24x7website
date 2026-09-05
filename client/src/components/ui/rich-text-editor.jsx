import * as React from 'react'
import { Bold, Italic, Underline, Heading2, Heading3, List, ListOrdered, Quote, Link2, Code, Minus, Eraser } from 'lucide-react'
import { cn } from '@/lib/utils'

const TOOLBAR_BTN = 'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-40'

function exec(cmd, val = null) {
  document.execCommand(cmd, false, val)
}

export function RichTextEditor({ value, onChange, placeholder = 'Write something...', className, error }) {
  const ref = React.useRef(null)
  const isComposing = React.useRef(false)

  // Sync external value to DOM only when not focused or when value is empty
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (document.activeElement === el) return
    const html = value || ''
    // Convert plain text (no tags) to wrapped <p>
    const normalized = html && !/<[a-z][\s\S]*>/i.test(html) ? `<p>${escapeHtml(html).replace(/\n/g, '<br>')}</p>` : html
    if (el.innerHTML !== normalized) el.innerHTML = normalized
  }, [value])

  const handleInput = React.useCallback(() => {
    if (isComposing.current) return
    const html = ref.current?.innerHTML || ''
    // Normalize empty <p><br></p> to empty string
    const isEmpty = !html || html === '<br>' || html === '<p><br></p>' || html.replace(/<[^>]*>/g, '').trim() === ''
    onChange?.(isEmpty ? '' : html)
  }, [onChange])

  const apply = (cmd, val) => {
    ref.current?.focus()
    exec(cmd, val)
    handleInput()
  }

  const addLink = () => {
    const url = window.prompt('Enter URL (https://...)')
    if (!url) return
    const normalized = url.startsWith('http') ? url : `https://${url}`
    // execCommand createLink
    document.execCommand('createLink', false, normalized)
    // Ensure links open in new tab
    setTimeout(() => {
      if (!ref.current) return
      ref.current.querySelectorAll(`a[href="${normalized}"]`).forEach((a) => {
        a.setAttribute('target', '_blank')
        a.setAttribute('rel', 'noopener noreferrer')
      })
      handleInput()
    }, 0)
  }

  return (
    <div className={cn('rounded-xl border border-input bg-background', error && 'border-destructive', className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/30 p-1">
        <button type="button" className={TOOLBAR_BTN} onMouseDown={(e) => e.preventDefault()} onClick={() => apply('bold')} title="Bold (Ctrl+B)" aria-label="Bold">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" className={TOOLBAR_BTN} onMouseDown={(e) => e.preventDefault()} onClick={() => apply('italic')} title="Italic (Ctrl+I)" aria-label="Italic">
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" className={TOOLBAR_BTN} onMouseDown={(e) => e.preventDefault()} onClick={() => apply('underline')} title="Underline (Ctrl+U)" aria-label="Underline">
          <Underline className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" className={TOOLBAR_BTN} onMouseDown={(e) => e.preventDefault()} onClick={() => apply('formatBlock', '<h2>')} title="Heading 2" aria-label="Heading 2">
          <Heading2 className="h-4 w-4" />
        </button>
        <button type="button" className={TOOLBAR_BTN} onMouseDown={(e) => e.preventDefault()} onClick={() => apply('formatBlock', '<h3>')} title="Heading 3" aria-label="Heading 3">
          <Heading3 className="h-4 w-4" />
        </button>
        <button type="button" className={TOOLBAR_BTN} onMouseDown={(e) => e.preventDefault()} onClick={() => apply('formatBlock', '<p>')} title="Paragraph" aria-label="Paragraph">
          <span className="text-xs font-semibold">P</span>
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" className={TOOLBAR_BTN} onMouseDown={(e) => e.preventDefault()} onClick={() => apply('insertUnorderedList')} title="Bullet list" aria-label="Bullet list">
          <List className="h-4 w-4" />
        </button>
        <button type="button" className={TOOLBAR_BTN} onMouseDown={(e) => e.preventDefault()} onClick={() => apply('insertOrderedList')} title="Numbered list" aria-label="Numbered list">
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" className={TOOLBAR_BTN} onMouseDown={(e) => e.preventDefault()} onClick={() => apply('formatBlock', '<blockquote>')} title="Quote" aria-label="Quote">
          <Quote className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" className={TOOLBAR_BTN} onMouseDown={(e) => e.preventDefault()} onClick={addLink} title="Add link" aria-label="Add link">
          <Link2 className="h-4 w-4" />
        </button>
        <button type="button" className={TOOLBAR_BTN} onMouseDown={(e) => e.preventDefault()} onClick={() => apply('insertHorizontalRule')} title="Horizontal line" aria-label="Horizontal line">
          <Minus className="h-4 w-4" />
        </button>
        <button type="button" className={TOOLBAR_BTN} onMouseDown={(e) => e.preventDefault()} onClick={() => apply('removeFormat')} title="Clear formatting" aria-label="Clear formatting">
          <Eraser className="h-4 w-4" />
        </button>
        <button type="button" className={TOOLBAR_BTN} onMouseDown={(e) => e.preventDefault()} onClick={() => apply('formatBlock', '<pre>')} title="Code" aria-label="Code">
          <Code className="h-4 w-4" />
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={handleInput}
        onCompositionStart={() => (isComposing.current = true)}
        onCompositionEnd={() => {
          isComposing.current = false
          handleInput()
        }}
        onBlur={handleInput}
        className={cn(
          'min-h-[180px] max-h-[420px] overflow-y-auto p-3 text-sm leading-relaxed outline-none',
          'prose prose-sm max-w-none prose-p:my-2 prose-headings:font-semibold prose-a:text-primary prose-a:underline prose-strong:font-semibold',
          '[&:empty:before]:text-muted-foreground [&:empty:before]:content-[attr(data-placeholder)]'
        )}
        // eslint-disable-next-line react/no-danger
        suppressContentEditableWarning
      />
      <p className="border-t border-input bg-muted/20 px-3 py-1.5 text-[11px] text-muted-foreground">
        Tip: Select text then use toolbar. Paste preserves basic formatting. Links open in new tab.
      </p>
    </div>
  )
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
