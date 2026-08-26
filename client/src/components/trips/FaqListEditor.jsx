import * as React from 'react'
import { useFieldArray, useController } from 'react-hook-form'
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// FAQ editor: add / edit / delete / reorder question–answer pairs.
export function FaqListEditor({ control, name = 'faqs' }) {
  const { fields, append, remove, swap } = useFieldArray({ control, name })

  return (
    <div>
      <Label>FAQs</Label>
      <div className="mt-1.5 space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">FAQ {index + 1}</span>
              <div className="flex items-center gap-1">
                <IconButton aria-label="Move FAQ up" onClick={() => swap(index, index - 1)} disabled={index === 0}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </IconButton>
                <IconButton
                  aria-label="Move FAQ down"
                  onClick={() => swap(index, index + 1)}
                  disabled={index === fields.length - 1}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </IconButton>
                <IconButton aria-label="Remove FAQ" onClick={() => remove(index)} className="hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              </div>
            </div>
            <div className="mt-2 space-y-2">
              <ControllerInput
                control={control}
                name={`${name}.${index}.question`}
                placeholder="Question"
                ariaLabel={`FAQ ${index + 1} question`}
              />
              <ControllerTextarea
                control={control}
                name={`${name}.${index}.answer`}
                placeholder="Answer"
                ariaLabel={`FAQ ${index + 1} answer`}
              />
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ question: '', answer: '' })}>
        <Plus className="h-4 w-4" />
        Add FAQ
      </Button>
    </div>
  )
}

function ControllerInput({ control, name, placeholder, ariaLabel }) {
  const { field } = useController({ control, name, defaultValue: '' })
  return (
    <Input
      placeholder={placeholder}
      aria-label={ariaLabel}
      value={field.value}
      onChange={field.onChange}
      ref={field.ref}
    />
  )
}

function ControllerTextarea({ control, name, placeholder, ariaLabel }) {
  const { field } = useController({ control, name, defaultValue: '' })
  return (
    <textarea
      placeholder={placeholder}
      aria-label={ariaLabel}
      value={field.value}
      onChange={field.onChange}
      ref={field.ref}
      rows={2}
      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  )
}

function IconButton({ children, className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}