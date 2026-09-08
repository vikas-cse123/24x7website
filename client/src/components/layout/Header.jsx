import * as React from 'react'
import { Menu, Phone } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Logo } from '@/components/brand/Logo'
import { HeaderSearch } from '@/components/layout/HeaderSearch'
import { SiteNav } from '@/components/layout/SiteNav'
import { HeaderAuth } from '@/components/layout/HeaderAuth'
import { HeaderPhone } from '@/components/layout/HeaderPhone'
import { MobileNav } from '@/components/layout/MobileNav'

// Mobile-first header: promo bar (above) + compact white header
// Mobile: hamburger (left) | centered 24x7Chhutti logo | phone icon (right)
// Desktop: logo left, centered search, phone + Login right, SiteNav row below.
// Search moves to full-width pill directly below header on mobile.
export function Header() {
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background shadow-header">
      {/* Top row */}
      <div className="relative flex h-[56px] items-center justify-between gap-3 px-5 sm:px-6 lg:h-20 lg:px-16 xl:px-20">
        {/* Mobile hamburger — left */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-haspopup="dialog"
          aria-expanded={mobileOpen}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Logo: centered on mobile, left-aligned on desktop */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:static lg:left-auto lg:top-auto lg:translate-x-0 lg:translate-y-0 lg:shrink-0">
          <Logo imgClassName="h-8 w-[72px] object-contain sm:h-10 sm:w-[80px] lg:h-[55px] lg:w-[110px]" />
        </div>

        {/* Desktop / tablet search — flex centered, not absolute (fixes phone overlapping search at ~1086px) */}
        <div className="hidden min-w-0 flex-1 justify-center px-2 md:flex lg:px-4">
          <HeaderSearch className="w-full max-w-[320px] lg:max-w-[380px] xl:max-w-[420px]" />
        </div>

        {/* Right cluster */}
        <div className="flex shrink-0 items-center gap-3 lg:gap-6">
          <HeaderPhone className="hidden lg:inline-flex" />
          <div className="hidden sm:block">
            <HeaderAuth />
          </div>
          {/* Mobile phone icon — right */}
          <a
            href="tel:+919958723666"
            aria-label="Call us"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            <Phone className="h-5 w-5" />
          </a>
        </div>
      </div>

      {/* Mobile search row — full-width pill directly below header */}
      <div className="border-t border-border bg-white px-5 py-3 sm:px-6 md:hidden">
        <HeaderSearch />
      </div>

      {/* Desktop navigation row — no separator line above it (seamless with
          the top header row, like the reference site). */}
      <div className="hidden lg:block">
        <Container>
          <SiteNav className="justify-center" />
        </Container>
      </div>

      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
    </header>
  )
}