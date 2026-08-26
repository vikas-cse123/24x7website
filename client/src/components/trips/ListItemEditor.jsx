import * as React from 'react'
import { useFieldArray, useController } from 'react-hook-form'
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Generic editor for an array of strings (inclusions, exclusions, activities,
// meals). Add / edit / remove / reorder rows.
export function ListItemEditor({ control, name, label, placeholder, hint }) {
  const { fields, append, remove, swap } = useFieldArray({ control, name })

  return (
    <div>
      <Label>{label}</Label>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-1.5 space-y-2">
        {fields.map((field, index) => (
          <StringRow
            key={field.id}
            control={control}
            name={`${name}.${index}`}
            label={label}
            index={index}
            total={fields.length}
            placeholder={placeholder}
            onUp={() => swap(index, index - 1)}
            onDown={() => swap(index, index + 1)}
            onRemove={() => remove(index)}
          />
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => append('')}
      >
        <Plus className="h-4 w-4" />
        Add {label.toLowerCase().replace(/s$/, '')}
      </Button>
    </div>
  )
}

function StringRow({ control, name, label, index, total, placeholder, onUp, onDown, onRemove }) {
  const { field } = useController({ control, name, defaultValue: '' })
  return (
    <div className="flex items-center gap-1.5">
      <Input
        placeholder={placeholder}
        aria-label={`${label} item ${index + 1}`}
        value={field.value}
        onChange={field.onChange}
        ref={field.ref}
      />
      <IconButton aria-label={`Move ${label} item ${index + 1} up`} onClick={onUp} disabled={index === 0}>
        <ArrowUp className="h-4 w-4" />
      </IconButton>
      <IconButton
        aria-label={`Move ${label} item ${index + 1} down`}
        onClick={onDown}
        disabled={index === total - 1}
      >
        <ArrowDown className="h-4 w-4" />
      </IconButton>
      <IconButton
        aria-label={`Remove ${label} item ${index + 1}`}
        onClick={onRemove}
        className="hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </IconButton>
    </div>
  )
}

function IconButton({ children, className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}