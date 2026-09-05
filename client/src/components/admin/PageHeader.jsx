import * as React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function PageHeader({ backTo, backLabel, title, description, actions, className }) {
  return (
    <div className={cn('mb-5 flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        {backTo && (
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel || 'Back'}
          </Link>
        )}
        {title && (
          <h1 className="mt-1.5 text-xl font-bold tracking-tight sm:text-2xl truncate">{title}</h1>
        )}
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}

export function SaveBar({ dirty, saving, onDiscard, onSave, saveLabel = 'Save changes' }) {
  if (!dirty && !saving) return null
  return (
    <>
      {/* Desktop sticky top bar */}
      <div className="sticky top-[57px] z-20 -mx-4 mb-4 hidden items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm lg:flex lg:mx-0">
        <p className="text-sm font-medium text-amber-900">
          <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 mr-2 animate-pulse" />
          Unsaved changes
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onDiscard} disabled={saving} className="h-8">
            Discard
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving} className="h-8 shadow-sm">
            {saving ? 'Saving…' : saveLabel}
          </Button>
        </div>
      </div>
      {/* Mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-amber-200 bg-amber-50 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] lg:hidden">
        <p className="text-sm font-medium text-amber-900">Unsaved changes</p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onDiscard} disabled={saving} className="h-9">
            Discard
          </Button>
          <Button size="sm" onClick={onSave} disabled={saving} className="h-9">
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
      {/* spacer for mobile bar */}
      <div className="h-14 lg:hidden" />
    </>
  )
}
