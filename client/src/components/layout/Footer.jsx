import { Container } from '@/components/ui/container'
import { FooterPromo } from '@/components/layout/footer/FooterPromo'
import { FooterDestinations } from '@/components/layout/footer/FooterDestinations'
import { FooterInfo } from '@/components/layout/footer/FooterInfo'
import { FooterBottom } from '@/components/layout/footer/FooterBottom'

// Capture A Trip branded footer: a large cream "Adventure awaits you." brand
// area on top, destination link grids, contact/company information and the
// copyright/payment bar — all on one continuous warm cream background (#FFFDE5).
export function Footer() {
  return (
    <footer className="bg-[#FFFDE5] text-[#1f2937]">
      <FooterPromo />
      <Container className="max-w-none mx-0 w-full px-5 sm:px-6 lg:px-[90px] pb-12 lg:pb-16">
        <FooterDestinations />
        <div className="mt-10 border-t border-[#1b4332]/15 lg:mt-12" />
      </Container>
      <FooterInfo />
      <FooterBottom />
    </footer>
  )
}
