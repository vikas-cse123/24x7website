import { Card, CardContent } from '@/components/ui/card'

// Reusable placeholder for admin sections whose functionality is not built yet.
// Clearly marks the section as not implemented so it is never confused with a
// working feature.
export function AdminPlaceholderPage({ title }) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">{title}</h1>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 p-12 text-center">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">
            This section is not implemented yet. It will be built in a later
            milestone.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}