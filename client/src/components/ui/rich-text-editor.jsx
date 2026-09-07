import * as React from 'react'
import { Bold, Italic, Underline, Heading2, Heading3, List, ListOrdered, Quote, Link2, Code, Minus, Eraser } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sanitizeHtml, markdownToHtml } from '@/lib/sanitize'

const TOOLBAR_BTN = 'inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-40'
const TOOLBAR_BTN_ACTIVE = 'bg-accent text-foreground'

function exec(cmd, val = null) {
  document.execCommand(cmd, false, val)
}

export function RichTextEditor({ value, onChange, placeholder = 'Write something...', className, error }) {
  const ref = React.useRef(null)
  const textareaRef = React.useRef(null)
  const isComposing = React.useRef(false)
  const [isSource, setIsSource] = React.useState(false)

  // Keep source textarea in sync with value when not editing source
  const [sourceDraft, setSourceDraft] = React.useState(value || '')
  React.useEffect(() => {
    if (!isSource) setSourceDraft(value || '')
  }, [value, isSource])

  // Sync external value to DOM only when not focused or when value is empty
  React.useEffect(() => {
    if (isSource) return
    const el = ref.current
    if (!el) return
    if (document.activeElement === el) return
    const html = value || ''
    let normalized = html
    if (html && !/<[a-z][\s\S]*>/i.test(html)) {
      if (/^(#{1,4})\s+/m.test(html) || /\*\*/.test(html) || /^\d+\.\s+/m.test(html) || /^[-*]\s+/m.test(html)) {
        normalized = markdownToHtml(html)
      } else {
        normalized = `<p>${escapeHtml(html).replace(/\n/g, '<br>')}</p>`
      }
    } else if (html) {
      const sanitized = sanitizeHtml(html)
      if (sanitized && sanitized !== html) {
        normalized = sanitized
      }
    }
    if (el.innerHTML !== normalized) {
      el.innerHTML = normalized
    }
  }, [value, isSource])

  const handleInput = React.useCallback(() => {
    if (isComposing.current) return
    const html = ref.current?.innerHTML || ''
    const isEmpty = !html || html === '<br>' || html === '<p><br></p>' || html.replace(/<[^>]*>/g, '').trim() === ''
    onChange?.(isEmpty ? '' : html)
  }, [onChange])

  const handlePaste = React.useCallback((e) => {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html')
    const text = e.clipboardData.getData('text/plain')
    let toInsert = ''
    if (html && html.trim()) {
      // Sanitize pasted HTML, keep allowed tags
      const sanitized = sanitizeHtml(html)
      if (sanitized && /<[a-z]/i.test(sanitized)) {
        toInsert = sanitized
      } else if (text) {
        // HTML was mostly stripped (e.g., Word styles), fallback to text handling
        if (/<[a-z][\s\S]*>/i.test(text)) {
          toInsert = sanitizeHtml(text)
        } else if (/^(#{1,4})\s+/m.test(text) || /\*\*/.test(text) || /^\d+\.\s+/m.test(text) || /^[-*]\s+/m.test(text)) {
          toInsert = markdownToHtml(text)
        } else {
          // Plain paragraphs
          const parts = text.split(/\n{2,}/).map(p=>p.trim()).filter(Boolean)
          if (parts.length) {
            toInsert = parts.map(p=> `<p>${escapeHtml(p).replace(/\n/g,'<br>')}</p>`).join('')
          } else {
            toInsert = `<p>${escapeHtml(text).replace(/\n/g,'<br>')}</p>`
          }
        }
      } else {
        toInsert = sanitized
      }
    } else if (text) {
      if (/<[a-z][\s\S]*>/i.test(text)) {
        toInsert = sanitizeHtml(text)
      } else if (/^(#{1,4})\s+/m.test(text) || /\*\*/.test(text) || /^\d+\.\s+/m.test(text) || /^[-*]\s+/m.test(text)) {
        toInsert = markdownToHtml(text)
      } else {
        // Plain text: split paragraphs
        const parts = text.split(/\n{2,}/).map(p=>p.trim()).filter(Boolean)
        if (parts.length) {
          toInsert = parts.map(p=> `<p>${escapeHtml(p).replace(/\n/g,'<br>')}</p>`).join('')
        } else if (text.trim()) {
          toInsert = `<p>${escapeHtml(text).replace(/\n/g,'<br>')}</p>`
        }
      }
    }
    if (toInsert) {
      const el = ref.current
      if (el) {
        const sel = window.getSelection()
        if (sel && sel.rangeCount > 0) {
          let node = sel.getRangeAt(0).startContainer
          if (node.nodeType === Node.TEXT_NODE) node = node.parentElement
          let parent = node
          while (parent && parent !== el) {
            const tag = parent.tagName?.toLowerCase()
            if (tag === 'h2' || tag === 'h3' || tag === 'h4') {
              const range = document.createRange()
              range.setStartAfter(parent)
              range.collapse(true)
              sel.removeAllRanges()
              sel.addRange(range)
              break
            }
            parent = parent.parentElement
          }
        }
      }
      document.execCommand('insertHTML', false, toInsert)
      handleInput()
    }
  }, [handleInput])

  const apply = (cmd, val) => {
    if (isSource) return
    ref.current?.focus()
    exec(cmd, val)
    handleInput()
  }

  const addLink = () => {
    if (isSource) return
    const url = window.prompt('Enter URL (https://...)')
    if (!url) return
    const normalized = url.startsWith('http') ? url : `https://${url}`
    document.execCommand('createLink', false, normalized)
    setTimeout(() => {
      if (!ref.current) return
      ref.current.querySelectorAll(`a[href="${normalized}"]`).forEach((a) => {
        a.setAttribute('target', '_blank')
        a.setAttribute('rel', 'noopener noreferrer')
      })
      handleInput()
    }, 0)
  }

  const toggleSource = () => {
    if (!isSource) {
      const html = ref.current?.innerHTML || value || ''
      const isEmpty = !html || html === '<br>' || html === '<p><br></p>' || html.replace(/<[^>]*>/g, '').trim() === ''
      const toShow = isEmpty ? '' : html
      setSourceDraft(toShow)
      if (textareaRef.current) textareaRef.current.value = toShow
      setIsSource(true)
    } else {
      const raw = textareaRef.current ? textareaRef.current.value : sourceDraft
      const src = raw != null ? String(raw) : ''
      const hasHtml = /<[a-z][\s\S]*>/i.test(src)
      let finalHtml = ''
      if (!src.trim()) {
        finalHtml = ''
      } else if (hasHtml) {
        const sanitized = sanitizeHtml(src)
        finalHtml = sanitized || src
      } else if (/^(#{1,4})\s+/m.test(src) || /\*\*/.test(src) || /^\d+\.\s+/m.test(src) || /^[-*]\s+/m.test(src)) {
        finalHtml = markdownToHtml(src)
      } else {
        const parts = src.split(/\n{2,}/).map(p=>p.trim()).filter(Boolean)
        if (parts.length) {
          finalHtml = parts.map(p=> `<p>${escapeHtml(p).replace(/\n/g,'<br>')}</p>`).join('')
        } else if (src.trim()) {
          finalHtml = `<p>${escapeHtml(src).replace(/\n/g,'<br>')}</p>`
        }
      }
      const editorBefore = ref.current?.innerHTML
      onChange?.(finalHtml)
      setSourceDraft(finalHtml)
      setIsSource(false)
      setTimeout(() => {
        if (ref.current) {
          ref.current.innerHTML = finalHtml || ''
          const ed = document.querySelector('[contenteditable="true"]')
          // Check computed style if h2 exists but looks like p
          const h2 = ed?.querySelector('h2')
        }
      }, 0)
    }
  }

  const handleSourceChange = (e) => {
    const v = e.target.value
    setSourceDraft(v)
    onChange?.(v)
  }

  return (
    <div className={cn('rounded-xl border border-input bg-background', error && 'border-destructive', className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/30 p-1">
        <button type="button" className={cn(TOOLBAR_BTN, isSource && 'opacity-40 cursor-not-allowed')} disabled={isSource} onMouseDown={(e) => e.preventDefault()} onClick={() => apply('bold')} title="Bold (Ctrl+B)" aria-label="Bold">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" className={cn(TOOLBAR_BTN, isSource && 'opacity-40 cursor-not-allowed')} disabled={isSource} onMouseDown={(e) => e.preventDefault()} onClick={() => apply('italic')} title="Italic (Ctrl+I)" aria-label="Italic">
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" className={cn(TOOLBAR_BTN, isSource && 'opacity-40 cursor-not-allowed')} disabled={isSource} onMouseDown={(e) => e.preventDefault()} onClick={() => apply('underline')} title="Underline (Ctrl+U)" aria-label="Underline">
          <Underline className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" className={cn(TOOLBAR_BTN, isSource && 'opacity-40 cursor-not-allowed')} disabled={isSource} onMouseDown={(e) => e.preventDefault()} onClick={() => apply('formatBlock', '<h2>')} title="Heading 2" aria-label="Heading 2">
          <Heading2 className="h-4 w-4" />
        </button>
        <button type="button" className={cn(TOOLBAR_BTN, isSource && 'opacity-40 cursor-not-allowed')} disabled={isSource} onMouseDown={(e) => e.preventDefault()} onClick={() => apply('formatBlock', '<h3>')} title="Heading 3" aria-label="Heading 3">
          <Heading3 className="h-4 w-4" />
        </button>
        <button type="button" className={cn(TOOLBAR_BTN, isSource && 'opacity-40 cursor-not-allowed')} disabled={isSource} onMouseDown={(e) => e.preventDefault()} onClick={() => apply('formatBlock', '<p>')} title="Paragraph" aria-label="Paragraph">
          <span className="text-xs font-semibold">P</span>
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" className={cn(TOOLBAR_BTN, isSource && 'opacity-40 cursor-not-allowed')} disabled={isSource} onMouseDown={(e) => e.preventDefault()} onClick={() => apply('insertUnorderedList')} title="Bullet list" aria-label="Bullet list">
          <List className="h-4 w-4" />
        </button>
        <button type="button" className={cn(TOOLBAR_BTN, isSource && 'opacity-40 cursor-not-allowed')} disabled={isSource} onMouseDown={(e) => e.preventDefault()} onClick={() => apply('insertOrderedList')} title="Numbered list" aria-label="Numbered list">
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" className={cn(TOOLBAR_BTN, isSource && 'opacity-40 cursor-not-allowed')} disabled={isSource} onMouseDown={(e) => e.preventDefault()} onClick={() => apply('formatBlock', '<blockquote>')} title="Quote" aria-label="Quote">
          <Quote className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" className={cn(TOOLBAR_BTN, isSource && 'opacity-40 cursor-not-allowed')} disabled={isSource} onMouseDown={(e) => e.preventDefault()} onClick={addLink} title="Add link" aria-label="Add link">
          <Link2 className="h-4 w-4" />
        </button>
        <button type="button" className={cn(TOOLBAR_BTN, isSource && 'opacity-40 cursor-not-allowed')} disabled={isSource} onMouseDown={(e) => e.preventDefault()} onClick={() => apply('insertHorizontalRule')} title="Horizontal line" aria-label="Horizontal line">
          <Minus className="h-4 w-4" />
        </button>
        <button type="button" className={cn(TOOLBAR_BTN, isSource && 'opacity-40 cursor-not-allowed')} disabled={isSource} onMouseDown={(e) => e.preventDefault()} onClick={() => apply('removeFormat')} title="Clear formatting" aria-label="Clear formatting">
          <Eraser className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button
          type="button"
          className={cn(TOOLBAR_BTN, isSource && TOOLBAR_BTN_ACTIVE)}
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggleSource}
          title={isSource ? 'Visual mode' : 'HTML source (<>)'}
          aria-label={isSource ? 'Switch to visual mode' : 'Switch to HTML source'}
        >
          <Code className="h-4 w-4" />
        </button>
      </div>
      {isSource ? (
        <textarea
          ref={textareaRef}
          value={sourceDraft}
          onChange={handleSourceChange}
          placeholder={placeholder}
          className={cn(
            'min-h-[180px] max-h-[420px] w-full resize-y bg-white p-3 font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground',
            'focus-visible:ring-0'
          )}
          spellCheck={false}
        />
      ) : (
        <div
          ref={ref}
          contentEditable
          role="textbox"
          aria-multiline="true"
          data-placeholder={placeholder}
          onInput={handleInput}
          onPaste={handlePaste}
          onCompositionStart={() => (isComposing.current = true)}
          onCompositionEnd={() => {
            isComposing.current = false
            handleInput()
          }}
          onBlur={handleInput}
          className={cn(
            'min-h-[180px] max-h-[420px] overflow-y-auto p-3 text-sm leading-relaxed outline-none',
            'prose prose-sm max-w-none prose-p:my-2 prose-headings:font-semibold prose-h2:text-lg prose-h3:text-base prose-a:text-primary prose-a:underline prose-strong:font-semibold prose-ul:list-disc prose-ol:list-decimal prose-li:my-1 prose-blockquote:border-l-2 prose-blockquote:border-primary prose-blockquote:pl-3 prose-blockquote:italic',
            '[&:empty:before]:text-muted-foreground [&:empty:before]:content-[attr(data-placeholder)]'
          )}
          suppressContentEditableWarning
        />
      )}
      <p className="border-t border-input bg-muted/20 px-3 py-1.5 text-[11px] text-muted-foreground">
        {isSource ? 'HTML source mode — paste valid HTML here. Switch back to visual to see formatting.' : 'Tip: Select text then use toolbar. Paste preserves headings, lists, bold and links. Use <> for HTML source.'}
      </p>
    </div>
  )
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
