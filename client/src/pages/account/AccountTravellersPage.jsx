import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { accountApi } from '@/services/account'

const EMPTY = { firstName: '', lastName: '', email: '', phone: '', gender: '', dateOfBirth: '' }

function validate(data) {
  const errors = {}
  if (!data.firstName.trim()) errors.firstName = 'First name is required'
  if (!data.lastName.trim()) errors.lastName = 'Last name is required'
  if (data.email && !/^\S+@\S+\.\S+$/.test(data.email.trim())) errors.email = 'Enter a valid email address'
  if (data.phone && !/^[0-9+\-\s]{7,15}$/.test(data.phone.trim())) errors.phone = 'Enter a valid phone number'
  if (data.dateOfBirth && new Date(`${data.dateOfBirth}T00:00:00Z`) >= new Date())
    errors.dateOfBirth = 'Date of birth must be in the past'
  return errors
}

function TravellerDialog({ open, initial, onOpenChange, onSubmit, pending, serverError }) {
  const [form, setForm] = React.useState(EMPTY)
  const [errors, setErrors] = React.useState({})

  React.useEffect(() => {
    if (open) {
      setForm(initial ? { ...EMPTY, ...initial, gender: initial.gender || '', dateOfBirth: initial.dateOfBirth || '' } : EMPTY)
      setErrors({})
    }
  }, [open, initial])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  function submit(e) {
    e.preventDefault()
    const next = validate(form)
    setErrors(next)
    if (Object.keys(next).length > 0) return
    onSubmit({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      countryCode: '+91',
      gender: form.gender || null,
      dateOfBirth: form.dateOfBirth || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <div className="max-h-[85vh] overflow-y-auto p-6">
          <h2 className="text-lg font-semibold">{initial ? 'Edit traveller' : 'Add traveller'}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Saved travellers make booking faster. Details are copied into each booking.
          </p>
          <form onSubmit={submit} noValidate className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tv-first">First name *</Label>
              <Input id="tv-first" className="mt-1.5" value={form.firstName} autoComplete="given-name"
                aria-invalid={!!errors.firstName} onChange={set('firstName')} />
              {errors.firstName && <p className="mt-1 text-xs text-destructive">{errors.firstName}</p>}
            </div>
            <div>
              <Label htmlFor="tv-last">Last name *</Label>
              <Input id="tv-last" className="mt-1.5" value={form.lastName} autoComplete="family-name"
                aria-invalid={!!errors.lastName} onChange={set('lastName')} />
              {errors.lastName && <p className="mt-1 text-xs text-destructive">{errors.lastName}</p>}
            </div>
            <div>
              <Label htmlFor="tv-email">Email</Label>
              <Input id="tv-email" type="email" className="mt-1.5" value={form.email} autoComplete="email"
                aria-invalid={!!errors.email} onChange={set('email')} />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="tv-phone">Phone</Label>
              <div className="mt-1.5 flex items-stretch gap-2">
                <span className="inline-flex h-11 shrink-0 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">+91</span>
                <Input id="tv-phone" type="tel" maxLength={10} value={form.phone} autoComplete="tel-national"
                  aria-invalid={!!errors.phone} onChange={set('phone')} />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
            </div>
            <div>
              <Label htmlFor="tv-gender">Gender</Label>
              <select
                id="tv-gender"
                className="mt-1.5 flex h-11 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.gender}
                onChange={set('gender')}
              >
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="tv-dob">Date of birth</Label>
              <Input id="tv-dob" type="date" className="mt-1.5" value={form.dateOfBirth}
                aria-invalid={!!errors.dateOfBirth} onChange={set('dateOfBirth')} />
              {errors.dateOfBirth && <p className="mt-1 text-xs text-destructive">{errors.dateOfBirth}</p>}
            </div>
            {serverError && (
              <p role="alert" className="text-xs text-destructive sm:col-span-2">{serverError}</p>
            )}
            <div className="flex justify-end gap-3 sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? 'Saving…' : initial ? 'Save changes' : 'Add traveller'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DeleteDialog({ traveller, open, onOpenChange, onConfirm, pending }) {
  if (!traveller) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold">Remove traveller</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Remove <strong>{traveller.firstName} {traveller.lastName}</strong> from your
            saved travellers? Existing bookings are not affected.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Keep</Button>
            <Button variant="destructive" onClick={onConfirm} disabled={pending}>
              {pending ? 'Removing…' : 'Remove'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AccountTravellersPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState(null)
  const [deleteTarget, setDeleteTarget] = React.useState(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['account', 'travellers'],
    queryFn: accountApi.listTravellers,
  })
  const travellers = data?.data?.data?.items || []

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['account', 'travellers'] })

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }) =>
      id ? accountApi.updateTraveller(id, payload) : accountApi.createTraveller(payload),
    onSuccess: (_, vars) => {
      toast.success(vars.id ? 'Traveller updated' : 'Traveller added')
      invalidate()
      setDialogOpen(false)
    },
    onError: (err) => toast.error(err.message || 'Could not save traveller'),
  })
  const deleteMutation = useMutation({
    mutationFn: (id) => accountApi.deleteTraveller(id),
    onSuccess: () => {
      toast.success('Traveller removed')
      invalidate()
      setDeleteTarget(null)
    },
    onError: (err) => toast.error(err.message || 'Could not remove traveller'),
  })

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }
  if (isError) {
    return (
      <Card className="border-destructive/40 p-6 text-sm text-destructive">
        Could not load travellers. {error?.message || 'Please try again.'}
      </Card>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Saved details are copied into bookings when you choose them.
        </p>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add traveller
        </Button>
      </div>

      {!travellers.length ? (
        <Card className="mt-4 p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
          <p className="mt-3 text-lg font-medium">No saved travellers yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add one to fill booking forms faster.
          </p>
          <Button className="mt-5" onClick={() => { setEditing(null); setDialogOpen(true) }}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add your first traveller
          </Button>
        </Card>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {travellers.map((t) => (
            <Card key={t.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold leading-snug">
                    {t.firstName} {t.lastName}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {[t.email, t.phone].filter(Boolean).join(' · ') || 'No contact details'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    title="Edit traveller"
                    aria-label={`Edit ${t.firstName}`}
                    onClick={() => { setEditing(t); setDialogOpen(true) }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    title="Remove traveller"
                    aria-label={`Remove ${t.firstName}`}
                    onClick={() => setDeleteTarget(t)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              {(t.gender || t.dateOfBirth) && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {t.gender && <Badge variant="secondary" className="capitalize">{t.gender}</Badge>}
                  {t.dateOfBirth && <Badge variant="outline">{t.dateOfBirth}</Badge>}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <TravellerDialog
        open={dialogOpen}
        initial={editing}
        onOpenChange={setDialogOpen}
        pending={saveMutation.isPending}
        onSubmit={(payload) => saveMutation.mutate({ id: editing?.id, payload })}
      />
      <DeleteDialog
        traveller={deleteTarget}
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        pending={deleteMutation.isPending}
      />
    </div>
  )
}
