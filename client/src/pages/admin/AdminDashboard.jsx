import { useQuery } from '@tanstack/react-query'
import { MapPin, Plane, CalendarRange, BookOpen, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adminApi } from '@/services/admin'

const METRIC_CARDS = [
  { key: 'destinations', label: 'Destinations', icon: MapPin },
  { key: 'trips', label: 'Trips', icon: Plane },
  { key: 'upcomingBatches', label: 'Upcoming Batches', icon: CalendarRange },
  { key: 'openBatches', label: 'Open Batches', icon: CalendarRange },
  { key: 'fullBatches', label: 'Full Batches', icon: CalendarRange },
  { key: 'bookings', label: 'Total Bookings', icon: BookOpen },
  { key: 'pendingBookings', label: 'Pending Bookings', icon: BookOpen },
  { key: 'confirmedBookings', label: 'Confirmed Bookings', icon: BookOpen },
  { key: 'paymentPendingBookings', label: 'Payment Pending', icon: BookOpen },
  { key: 'enquiries', label: 'Enquiries', icon: MessageSquare },
]

export function AdminDashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: adminApi.dashboard,
  })

  // API envelope: { success, data: {...} }
  const summary = data?.data?.data || {}

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of the platform. Metrics populate as data is added.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {METRIC_CARDS.map((c) => (
            <Card key={c.key} className="h-28 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <Card className="border-destructive/40">
          <CardContent className="p-6 text-sm text-destructive">
            Could not load dashboard data. {error?.message || 'Please try again.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {METRIC_CARDS.map((card) => {
            const Icon = card.icon
            const value = Number(summary[card.key]) || 0
            return (
              <Card key={card.key}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {value === 0 ? 'No data yet' : 'Items'}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}