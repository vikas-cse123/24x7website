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
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Dashboard</h1>
        <p className="text-xs text-slate-500">Overview — metrics populate as data is added.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {METRIC_CARDS.map((c) => (
            <Card key={c.key} className="h-20 animate-pulse rounded-lg border-slate-200" />
          ))}
        </div>
      ) : isError ? (
        <Card className="border-red-200 bg-red-50 p-3 text-xs text-red-700">Could not load dashboard data. {error?.message || 'Please try again.'}</Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {METRIC_CARDS.map((card) => {
            const Icon = card.icon
            const value = Number(summary[card.key]) || 0
            return (
              <Card key={card.key} className="rounded-lg border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-semibold text-slate-500">{card.label}</p>
                  <Icon className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <p className="mt-2 text-xl font-bold tracking-tight">{value}</p>
                <p className="text-xs text-slate-500">{value === 0 ? 'No data yet' : 'Items'}</p>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}