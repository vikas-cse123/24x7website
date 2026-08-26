import { Container } from '@/components/ui/container'

// Reusable placeholder for routes whose real content is not yet built.
// Prevents broken links while keeping the navigation structure valid.
export function PlaceholderPage({ title }) {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-3 text-muted-foreground">
          This page is not built yet. It will be implemented in a later
          milestone.
        </p>
      </div>
    </Container>
  )
}
