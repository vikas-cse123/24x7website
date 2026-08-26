import * as React from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

// Visual travel search input. No backend search yet — this is the UI shell.
// The real search system (backend + results page) will be wired in a later
// milestone. `onSearch` is provided now so it can be connected later.
export function HeaderSearch({ onSearch, className, inputClassName }) {
  const [query, setQuery] = React.useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed && onSearch) onSearch(trimmed)
    // No-op for now (no search results page implemented).
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn('relative w-full', className)}
    >
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search destinations, trips…"
        aria-label="Search destinations and trips"
        className={cn(
          'h-10 w-full rounded-full border border-input bg-muted/50 pl-9 pr-4 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          inputClassName
        )}
      />
    </form>
  )
}
