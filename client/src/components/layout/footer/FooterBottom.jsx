import { Container } from '@/components/ui/container'
import { FOOTER_COPYRIGHT } from '@/lib/footerData'

const PAYMENT_LOGOS = [
  { label: 'VISA', src: '/payments/visa.svg' },
  { label: 'Mastercard', src: '/payments/masterCard.svg' },
  { label: 'RuPay', src: '/payments/RuPay.svg' },
  { label: 'UPI', src: '/payments/UPI.svg' },
]

export function FooterBottom() {
  return (
    <div className="border-t border-[#1b4332]/15">
      <Container className="flex max-w-none mx-0 w-full flex-col gap-4 px-5 py-6 pr-20 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pr-24 lg:px-[90px] lg:pr-[90px]">
        <p className="text-xs text-[#4b5563] sm:text-sm">{FOOTER_COPYRIGHT}</p>
        <div
          className="flex flex-wrap items-center gap-x-5 gap-y-2"
          aria-label="Payment methods"
        >
          {PAYMENT_LOGOS.map(({ label, src }) => (
            <img
              key={label}
              src={src}
              alt={label}
              loading="lazy"
              className="h-4 w-auto object-contain"
            />
          ))}
        </div>
      </Container>
    </div>
  )
}
