import * as React from 'react'

// Lightweight SEO helper for the SPA. Dynamically sets document title, meta
// description, canonical link and Open Graph basics. No heavy SEO framework.
export function useSeo({ title, description, canonical, noindex, ogType, ogImage } = {}) {
  React.useEffect(() => {
    const fullTitle = title ? `${title} | 24x7Chhutti` : '24x7Chhutti'
    const prevTitle = document.title
    document.title = fullTitle

    const applyOrCreate = (selector, attr, name, content) => {
      let el = document.querySelector(selector)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
      return el
    }
    const prevDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || ''
    applyOrCreate('meta[name="description"]', 'name', 'description', description || '24x7Chhutti — travel packages with departure dates, itineraries and pricing. Group and customised trips, available around the clock.')

    // Open Graph basics (article pages set ogType/ogImage).
    const prevOg = {}
    const ogTags = [
      ['meta[property="og:title"]', 'property', 'og:title', fullTitle],
      ['meta[property="og:site_name"]', 'property', 'og:site_name', '24x7Chhutti'],
      ...(ogType ? [['meta[property="og:type"]', 'property', 'og:type', ogType]] : []),
      ...(ogImage ? [['meta[property="og:image"]', 'property', 'og:image', ogImage]] : []),
      ...(description ? [['meta[property="og:description"]', 'property', 'og:description', description]] : []),
    ]
    const createdOg = []
    for (const [sel, attr, name, content] of ogTags) {
      const existing = document.querySelector(sel)
      if (existing) prevOg[sel] = existing.getAttribute('content')
      else createdOg.push(sel)
      applyOrCreate(sel, attr, name, content)
    }

    // Private pages (booking flow, confirmation) must not be indexed.
    let robotsEl = document.querySelector('meta[name="robots"]')
    if (noindex) {
      if (!robotsEl) {
        robotsEl = document.createElement('meta')
        robotsEl.setAttribute('name', 'robots')
        document.head.appendChild(robotsEl)
      }
      robotsEl.setAttribute('content', 'noindex, nofollow')
    }

    let canonicalEl = document.querySelector('link[rel="canonical"]')
    const prevCanonical = canonicalEl?.getAttribute('href') || null
    if (canonical && !noindex) {
      if (!canonicalEl) {
        canonicalEl = document.createElement('link')
        canonicalEl.setAttribute('rel', 'canonical')
        document.head.appendChild(canonicalEl)
      }
      canonicalEl.setAttribute('href', canonical)
    } else if (canonicalEl) {
      canonicalEl.removeAttribute('href')
    }

    return () => {
      document.title = prevTitle
      const desc = document.querySelector('meta[name="description"]')
      if (desc) desc.setAttribute('content', prevDescription)
      if (noindex && robotsEl) robotsEl.remove()
      for (const sel of createdOg) document.querySelector(sel)?.remove()
      for (const [sel, val] of Object.entries(prevOg)) {
        document.querySelector(sel)?.setAttribute('content', val)
      }
      if (canonicalEl) {
        if (prevCanonical) canonicalEl.setAttribute('href', prevCanonical)
        else canonicalEl.removeAttribute('href')
      }
    }
  }, [title, description, canonical, noindex, ogType, ogImage])
}

export function destinationSeoTitle(name) {
  return name ? `${name} Tour Packages` : undefined
}

export function tripSeoTitle(name) {
  return name ? `${name} Tour Package` : undefined
}