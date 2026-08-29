import * as React from 'react'
import { Menu } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Logo } from '@/components/brand/Logo'
import { HeaderSearch } from '@/components/layout/HeaderSearch'
import { SiteNav } from '@/components/layout/SiteNav'
import { HeaderAuth } from '@/components/layout/HeaderAuth'
import { HeaderPhone } from '@/components/layout/HeaderPhone'
import { MobileNav } from '@/components/layout/MobileNav'

// Main header: logo (admin-managed branding) left, compact centered search,
// phone + Login right, navigation row underneath. On mobile the search moves to
// a dedicated row below the logo so the top row never overflows.
export function Header() {
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background shadow-header">
      <Container>
        <div className="flex h-16 items-center gap-3 lg:h-20">
          <Logo imgClassName="h-10 lg:h-12" />

          {/* Desktop / tablet search — compact and centered */}
          <div className="hidden min-w-0 flex-1 justify-center md:flex">
            <HeaderSearch className="w-full max-w-[220px] lg:max-w-[260px]" />
          </div>

          {/* Right cluster: phone + Login + mobile menu */}
          <div className="ml-auto flex items-center gap-2 lg:gap-4">
            <HeaderPhone className="hidden lg:inline-flex" />
            <div className="hidden sm:block">
              <HeaderAuth />
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={mobileOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile search row */}
        <div className="border-t border-border py-2 md:hidden">
          <HeaderSearch />
        </div>

        {/* Desktop navigation row */}
        <div className="hidden border-t border-border lg:block">
          <SiteNav className="justify-center" />
        </div>
      </Container>

      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
    </header>
  )
}