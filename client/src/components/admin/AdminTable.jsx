import * as React from 'react'
import { cn } from '@/lib/utils'

export function AdminTable({ children, className }) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-slate-200 bg-white', className)}>
      <div className="overflow-auto">
        <table className="w-full text-xs">{children}</table>
      </div>
    </div>
  )
}

export function AdminTableHeader({ children }) {
  return <thead className="bg-slate-50 sticky top-0">{children}</thead>
}

export function AdminTableHead({ children, className, ...props }) {
  return (
    <th className={cn('px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500', className)} {...props}>
      {children}
    </th>
  )
}

export function AdminTableBody({ children }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>
}

export function AdminTableRow({ children, className, ...props }) {
  return (
    <tr className={cn('hover:bg-slate-50', className)} {...props}>
      {children}
    </tr>
  )
}

export function AdminTableCell({ children, className, ...props }) {
  return (
    <td className={cn('px-2 py-1.5 align-middle', className)} {...props}>
      {children}
    </td>
  )
}
