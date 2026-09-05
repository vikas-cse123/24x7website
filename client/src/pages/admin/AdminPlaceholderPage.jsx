import { Card, CardContent } from '@/components/ui/card'

// Reusable placeholder for admin sections whose functionality is not built yet.
// Clearly marks the section as not implemented so it is never confused with a
// working feature.
export function AdminPlaceholderPage({ title }) {
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-bold tracking-tight">{title}</h1>
      <Card className="border-slate-200 bg-white">
        <CardContent className="flex flex-col items-center justify-center gap-1 p-8 text-center">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-slate-500">This section is not implemented yet — will be built in a later milestone.</p>
        </CardContent>
      </Card>
    </div>
  )
}