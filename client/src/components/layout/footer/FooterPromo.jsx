const BANNER_BG = '#FFFDE5'

export function FooterPromo() {
  return (
    <section
      aria-label="Adventure awaits you"
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: BANNER_BG }}
    >
      <div className="mx-auto max-w-[1280px] px-5 py-6 sm:px-6 sm:py-8 lg:px-[90px] lg:py-10">
        <img
          src="/api/media/website/footer/adventure-awaits-you.png"
          alt="Adventure awaits you"
          className="mx-auto block h-auto w-full"
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>
  )
}
