import * as React from 'react'
import { Menu } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Logo } from '@/components/brand/Logo'
import { HeaderSearch } from '@/components/layout/HeaderSearch'
import { SiteNav } from '@/components/layout/SiteNav'
import { HeaderAuth } from '@/components/layout/HeaderAuth'
import { MobileNav } from '@/components/layout/MobileNav'

export function Header() {
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur shadow-header">
      <Container>
        <div className="flex h-16 items-center gap-4 lg:h-20">
          <Logo imgClassName="h-9 lg:h-11" />

          {/* Desktop search */}
          <div className="mx-auto hidden max-w-md flex-1 md:block">
            <HeaderSearch />
          </div>

          <div className="ml-auto flex items-center gap-2">
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

        {/* Desktop navigation row */}
        <div className="hidden border-t border-border lg:block">
          <SiteNav className="h-12" />
        </div>
      </Container>

      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />
    </header>
  )
}
