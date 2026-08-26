import * as React from 'react'
import { Heart } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { wishlistApi } from '@/services/account'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

export function WishlistButton({ type, id, className, size = 32 }) {
  const { isAuthenticated } = useAuth()
  const openAuthModal = useUIStore(s=>s.openAuthModal)
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.list().then(r=>r.data.data),
    enabled: isAuthenticated,
    staleTime: 30000,
  })
  const items = data?.items || []
  const saved = items.some(it=> it.itemType===type && String(it.itemId)===String(id))
  const toggle = useMutation({
    mutationFn: () => saved ? wishlistApi.remove(type,id) : wishlistApi.create(type,id),
    onSuccess: ()=> qc.invalidateQueries({queryKey:['wishlist']}),
  })
  return (
    <button
      type="button"
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      aria-pressed={saved}
      onClick={(e)=>{
        e.preventDefault(); e.stopPropagation()
        if(!isAuthenticated) return openAuthModal()
        toggle.mutate()
      }}
      disabled={toggle.isPending}
      className={cn("inline-flex items-center justify-center rounded-full bg-white/90 backdrop-blur shadow hover:bg-white transition-colors", saved ? "text-red-500" : "text-muted-foreground", className)}
      style={{width:size, height:size}}
    >
      <Heart className={cn("h-4 w-4", saved && "fill-current")} />
    </button>
  )
}
