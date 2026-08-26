import * as React from 'react'
import { DestinationImage } from '@/components/destinations/DestinationImage'

// Renders the structured content blocks of a blog article (ADR-020).
// Paragraph text supports simple [text](url) inline links.
function InlineText({ text }) {
  const parts = String(text || '').split(/(\[[^\]]+\]\([^)]+\))/g)
  return (
    <>
      {parts.map((part, i) => {
        const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)
        if (m) {
          return (
            <a
              key={i}
              href={m[2]}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
            >
              {m[1]}
            </a>
          )
        }
        return <React.Fragment key={i}>{part}</React.Fragment>
      })}
    </>
  )
}

export function BlogContentView({ blocks = [] }) {
  return (
    <div className="space-y-5">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading': {
            const Tag = block.level === 2 ? 'h2' : block.level === 3 ? 'h3' : 'h4'
            const cls =
              block.level === 2
                ? 'mt-8 text-2xl font-bold tracking-tight first:mt-0'
                : block.level === 3
                  ? 'mt-6 text-xl font-semibold'
                  : 'mt-5 text-lg font-semibold'
            return (
              <Tag key={i} className={cls}>
                {block.text}
              </Tag>
            )
          }
          case 'paragraph':
            return (
              <p key={i} className="leading-relaxed text-foreground/90">
                <InlineText text={block.text} />
              </p>
            )
          case 'list':
            return (
              <ul key={i} className="space-y-2 pl-1">
                {(block.items || []).filter(Boolean).map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-foreground/90">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    <span>
                      <InlineText text={item} />
                    </span>
                  </li>
                ))}
              </ul>
            )
          case 'image':
            return (
              <figure key={i}>
                <DestinationImage
                  src={block.url}
                  alt={block.alt || ''}
                  className="aspect-[16/9] w-full rounded-xl"
                />
                {block.caption && (
                  <figcaption className="mt-2 text-center text-xs text-muted-foreground">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            )
          case 'quote':
            return (
              <blockquote
                key={i}
                className="border-l-4 border-primary bg-muted/30 px-5 py-3 text-lg font-medium italic leading-relaxed"
              >
                {block.text}
              </blockquote>
            )
          default:
            return null
        }
      })}
    </div>
  )
}
