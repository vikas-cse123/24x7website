import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export function AdminEmptyState({ title, description, actionLabel, actionTo, icon: Icon }) {
  return (
    <Card className="border-slate-200 bg-white p-8 text-center">
      {Icon && (
        <div className="mx-auto grid h-8 w-8 place-items-center rounded-md bg-slate-100 text-slate-500">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <p className="mt-3 text-sm font-semibold">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">{description}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="mt-4 inline-flex">
          <Button size="sm" className="h-7 text-xs">
            {actionLabel}
          </Button>
        </Link>
      )}
    </Card>
  )
}
