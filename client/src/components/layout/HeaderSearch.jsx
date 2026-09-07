import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

// Travel search input wired to the shared trip discovery system: submitting
// navigates to /trips?search=… (same as the hero search). `onSearch` may be
// provided by a caller to override the default navigation.
export function HeaderSearch({ onSearch, className, inputClassName }) {
  const [query, setQuery] = React.useState('')
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed && onSearch) {
      onSearch(trimmed)
      return
    }
    navigate(trimmed ? `/trips?search=${encodeURIComponent(trimmed)}` : '/trips')
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn('relative w-full', className)}
    >
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-600"
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search your trip..."
        aria-label="Search destinations and trips"
        className={cn(
          'h-11 w-full rounded-full border border-slate-300 bg-background pl-11 pr-5 text-sm text-foreground shadow-sm placeholder:text-slate-500 transition-colors hover:border-slate-400 focus:border-slate-500 focus:outline-none focus-visible:outline-none focus-visible:ring-0 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden',
          inputClassName
        )}
      />
    </form>
  )
}
