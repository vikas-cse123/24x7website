import { Link } from 'react-router-dom'
import { MapPin, IndianRupee, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { DestinationImage } from '@/components/destinations/DestinationImage'
import { WishlistButton } from '@/components/wishlist/WishlistButton'

// Reusable public destination card.
export function DestinationCard({ destination }) {
  const hasPrice = destination.startingPrice !== null && destination.startingPrice !== undefined

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-card-hover">
      <div className="relative aspect-[16/10]">
        <DestinationImage
          src={destination.heroImage?.url || destination.homepageImage?.url}
          alt={destination.heroImage?.alt || destination.homepageImage?.alt || destination.name}
          className="h-full w-full"
        />
        <WishlistButton type="destination" id={destination.id || destination._id} className="absolute right-2 top-2" size={28} />
        {destination.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
            Featured
          </span>
        )}
      </div>
      <CardContent className="p-5">
        <h3 className="text-lg font-semibold tracking-tight">{destination.name}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>
            {destination.country}
            {destination.region ? ` · ${destination.region}` : ''}
          </span>
        </p>
        {destination.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {String(destination.description).replace(/\s+/g, ' ').slice(0, 160)}
            {String(destination.description).length > 160 ? '...' : ''}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between">
          {hasPrice ? (
            <p className="text-sm">
              <span className="text-muted-foreground">from </span>
              <span className="inline-flex items-center font-semibold">
                <IndianRupee className="h-4 w-4" />
                {destination.startingPrice.toLocaleString('en-IN')}
              </span>
            </p>
          ) : (
            <span className="text-sm text-muted-foreground">Price on request</span>
          )}
          <Link
            to={`/destination/${destination.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            View Destination
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}