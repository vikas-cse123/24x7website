import * as React from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export function AdminToolbar({ search, onSearchChange, placeholder = 'Search...', filters, actions }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[180px] flex-1">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <Input placeholder={placeholder} value={search} onChange={(e) => onSearchChange?.(e.target.value)} className="h-7 pl-8 text-xs" />
      </div>
      {filters?.map((f) => (
        <Select key={f.key} value={f.value} onChange={(e) => f.onChange(e.target.value)} className="h-7 text-xs">
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      ))}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  )
}
