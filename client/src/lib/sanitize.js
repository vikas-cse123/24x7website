// Simple HTML sanitizer for rich-text content.
// Allows only safe semantic tags, strips scripts/styles and dangerous attributes.
// Used for pasted content and for rendering stored HTML.

const ALLOWED_TAGS = new Set([
  'h2','h3','h4',
  'p','br','hr',
  'strong','b','em','i','u',
  'ul','ol','li',
  'a','blockquote','pre','code','span'
])

// Map non-semantic tags to semantic equivalents
const TAG_MAP = {
  'b': 'strong',
  'i': 'em',
  'h1': 'h2', // demote h1 to h2 for destination pages
  'div': 'p',
  'font': 'span',
}

const ALLOWED_ATTRS = {
  'a': new Set(['href','title']),
}

function isSafeUrl(url) {
  if (!url) return false
  const s = String(url).trim()
  // Allow http, https, mailto, tel, and anchor links
  return /^(https?:\/\/|mailto:|tel:|#|\/)/i.test(s) && !/^(javascript|data|vbscript):/i.test(s)
}

export function sanitizeHtml(dirty) {
  if (!dirty) return ''
  const html = String(dirty)
  // Quick check: if no tags, return as is (will be handled as plain text elsewhere)
  if (!/<[a-z][\s\S]*>/i.test(html)) return html

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const body = doc.body

    // Remove script, style, meta, link, iframe, etc.
    body.querySelectorAll('script, style, meta, link, iframe, object, embed, form, input, button, select, textarea').forEach(el => el.remove())

    function cleanNode(node) {
      // Process children first (deep)
      const children = Array.from(node.childNodes)
      for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          cleanNode(child)
        } else if (child.nodeType === Node.COMMENT_NODE) {
          child.remove()
        }
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return
      const tag = node.tagName.toLowerCase()

      // Handle invalid block nesting: p/ul/ol/blockquote/pre inside h2/h3/h4
      if ((tag === 'p' || tag === 'ul' || tag === 'ol' || tag === 'blockquote' || tag === 'pre') && node.parentElement) {
        const parentTag = node.parentElement.tagName.toLowerCase()
        if (parentTag === 'h2' || parentTag === 'h3' || parentTag === 'h4') {
          const parent = node.parentElement
          parent.parentNode.insertBefore(node, parent.nextSibling)
          return
        }
      }
      if ((tag === 'h2' || tag === 'h3' || tag === 'h4') && node.parentElement) {
        const parentTag = node.parentElement.tagName.toLowerCase()
        if (parentTag === 'p' || parentTag === 'h2' || parentTag === 'h3' || parentTag === 'h4') {
          const parent = node.parentElement
          parent.parentNode.insertBefore(node, parent.nextSibling)
          return
        }
      }

      // Unwrap disallowed tags but keep their children
      const mappedTag = TAG_MAP[tag] || tag
      if (!ALLOWED_TAGS.has(mappedTag) && !TAG_MAP[tag]) {
        // Special handling for div with block content: keep as p if it contains text
        if (tag === 'div' || tag === 'section' || tag === 'article' || tag === 'header' || tag === 'footer') {
          // Convert div to p if it has text and not already inside p
          const parentTag = node.parentElement?.tagName?.toLowerCase()
          if (parentTag === 'p' || parentTag === 'li' || parentTag === 'h2' || parentTag === 'h3' || parentTag === 'h4') {
            // Unwrap div inside paragraph-like
            while (node.firstChild) node.parentNode.insertBefore(node.firstChild, node)
            node.remove()
            return
          } else {
            // Change div to p by creating new p
            const p = doc.createElement('p')
            while (node.firstChild) p.appendChild(node.firstChild)
            // Copy no attributes
            node.parentNode.replaceChild(p, node)
            // Clean the new p's children already done, but need to clean p itself attributes
            cleanNode(p)
            return
          }
        }
        // For span with only style, unwrap
        if (tag === 'span' || tag === 'font') {
          // If span has no semantic attributes, unwrap
          while (node.firstChild) node.parentNode.insertBefore(node.firstChild, node)
          node.remove()
          return
        }
        // For other disallowed tags, unwrap
        while (node.firstChild) node.parentNode.insertBefore(node.firstChild, node)
        node.remove()
        return
      }

      // If mapped, rename tag
      if (TAG_MAP[tag]) {
        const newEl = doc.createElement(mappedTag)
        while (node.firstChild) newEl.appendChild(node.firstChild)
        // Copy allowed attributes (none for mapped except maybe)
        node.parentNode.replaceChild(newEl, node)
        // Continue cleaning new element's attributes below, but need to handle it
        // Since we replaced, we should clean the new element
        cleanAttributes(newEl, mappedTag)
        // Also need to clean its children already done
        return
      }

      // Clean attributes for allowed tags
      cleanAttributes(node, tag)
    }

    function cleanAttributes(el, tag) {
      const allowed = ALLOWED_ATTRS[tag] || new Set()
      // Remove all attributes not in allowed list
      const attrs = Array.from(el.attributes)
      for (const attr of attrs) {
        const name = attr.name.toLowerCase()
        if (!allowed.has(name)) {
          el.removeAttribute(attr.name)
          continue
        }
        // For href, validate URL
        if (name === 'href' && !isSafeUrl(attr.value)) {
          el.removeAttribute('href')
        }
      }
      // Always remove style, class, id, etc. even if tag is allowed but attr not listed
      // Already handled, but explicitly remove style/class
      el.removeAttribute('style')
      el.removeAttribute('class')
      el.removeAttribute('id')
      // For <a>, ensure target and rel are safe
      if (tag === 'a' && el.hasAttribute('href')) {
        el.setAttribute('target', '_blank')
        el.setAttribute('rel', 'noopener noreferrer')
      }
    }

    // Special handling: if body contains only text without block wrapper, keep as is
    // But we need to clean all top-level children
    const topChildren = Array.from(body.childNodes)
    for (const child of topChildren) {
      if (child.nodeType === Node.ELEMENT_NODE) cleanNode(child)
    }

    // Post-process: Remove empty paragraphs that are just <p><br></p> or whitespace
    body.querySelectorAll('p, h2, h3, h4, li, blockquote').forEach(el => {
      const text = (el.textContent || '').trim()
      const hasMedia = el.querySelector('img, video, iframe')
      if (!text && !hasMedia && el.innerHTML.replace(/<br\s*\/?>/gi,'').trim() === '') {
        // Keep one <br> if it's the only content? Actually remove empty
        // But don't remove if it's the only child of body (to avoid empty)
        if (body.children.length > 1) el.remove()
      }
    })

    // Return innerHTML of body
    let clean = body.innerHTML.trim()
    // If the result is empty or only whitespace, return empty
    if (!clean || clean === '<br>' || clean === '<p><br></p>') return ''
    return clean
  } catch (e) {
    // Fallback: strip all tags if parser fails
    return String(dirty).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }
}

// Convert markdown to HTML for pasted plain text.
// Handles headings (#, ##, ###), bold, italic, lists, and paragraphs.
export function markdownToHtml(markdown) {
  if (!markdown || !markdown.trim()) return ''
  // If it already looks like HTML, return sanitized HTML
  if (/<[a-z][\s\S]*>/i.test(markdown)) {
    return sanitizeHtml(markdown)
  }
  const lines = String(markdown).split(/\r?\n/)
  let html = ''
  let inList = null // 'ul' or 'ol'
  let paragraphBuffer = []

  function flushParagraph() {
    if (paragraphBuffer.length) {
      const text = paragraphBuffer.join(' ').trim()
      if (text) {
        // Process inline markdown: bold, italic, links
        let processed = escapeHtml(text)
          // Bold: **text** or __text__
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/__(.+?)__/g, '<strong>$1</strong>')
          // Italic: *text* or _text_ (avoid matching bold)
          .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
          .replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>')
          // Links: [text](url)
          .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2">$1</a>')
        html += `<p>${processed}</p>`
      }
      paragraphBuffer = []
    }
  }

  function closeList() {
    if (inList) {
      html += `</${inList}>`
      inList = null
    }
  }

  for (let i=0; i<lines.length; i++) {
    const raw = lines[i]
    const line = raw.trim()
    if (!line) {
      flushParagraph()
      closeList()
      continue
    }
    // Headings: # , ## , ### , ####
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/)
    if (headingMatch) {
      flushParagraph()
      closeList()
      const level = headingMatch[1].length
      const text = headingMatch[2].trim()
      const tag = level === 1 ? 'h2' : level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4'
      const processed = escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
      html += `<${tag}>${processed}</${tag}>`
      continue
    }
    // Unordered list: - , * , •
    const ulMatch = line.match(/^[-*•]\s+(.+)$/)
    if (ulMatch) {
      flushParagraph()
      if (inList !== 'ul') {
        closeList()
        html += '<ul>'
        inList = 'ul'
      }
      const text = ulMatch[1].trim()
      const processed = escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
      html += `<li>${processed}</li>`
      continue
    }
    // Ordered list: 1. , 2. etc
    const olMatch = line.match(/^\d+\.\s+(.+)$/)
    if (olMatch) {
      flushParagraph()
      if (inList !== 'ol') {
        closeList()
        html += '<ol>'
        inList = 'ol'
      }
      const text = olMatch[1].trim()
      const processed = escapeHtml(text)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
      html += `<li>${processed}</li>`
      continue
    }
    // Regular paragraph line: accumulate
    paragraphBuffer.push(line)
    // If next line is blank or heading/list, flush
    const next = lines[i+1]?.trim() || ''
    if (!next || /^(#{1,4})\s+/.test(next) || /^[-*•]\s+/.test(next) || /^\d+\.\s+/.test(next)) {
      // Don't flush yet if it's part of same paragraph (no blank line)
      // But if next is blank, we flush
      if (!next) {
        flushParagraph()
      } else if (/^(#{1,4})\s+/.test(next) || /^[-*•]\s+/.test(next) || /^\d+\.\s+/.test(next)) {
        flushParagraph()
      }
    }
  }
  flushParagraph()
  closeList()
  // If no HTML tags were generated, wrap remaining as paragraphs
  if (!html && markdown.trim()) {
    return `<p>${escapeHtml(markdown).replace(/\n/g, '<br>')}</p>`
  }
  return sanitizeHtml(html)
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// For rendering: ensure plain text is wrapped, HTML is sanitized
export function normalizeDescriptionForDisplay(description) {
  if (!description) return ''
  const html = String(description)
  if (/<[a-z][\s\S]*>/i.test(html)) {
    return sanitizeHtml(html)
  }
  // Plain text: check if markdown
  if (/^(#{1,4})\s+/m.test(html) || /\*\*.+\*\*/.test(html)) {
    return markdownToHtml(html)
  }
  // Plain text paragraphs: split by double newlines
  const escaped = escapeHtml(html).replace(/\n/g, '<br>')
  return `<p>${escaped}</p>`
}
