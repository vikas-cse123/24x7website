import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Smartphone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { accountApi } from '@/services/account'
import { useAuth } from '@/hooks/useAuth'

export function AccountProfilePage() {
  const queryClient = useQueryClient()
  const { setAuthenticated } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['account', 'profile'],
    queryFn: accountApi.getProfile,
  })
  const profile = data?.data?.data

  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [errors, setErrors] = React.useState({})
  React.useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setEmail(profile.email || '')
    }
  }, [profile])

  const mutation = useMutation({
    mutationFn: (payload) => accountApi.updateProfile(payload),
    onSuccess: (res) => {
      toast.success('Profile updated')
      setAuthenticated(res.data.data)
      queryClient.invalidateQueries({ queryKey: ['account', 'profile'] })
    },
    onError: (err) => {
      if (err.errors?.length) {
        const map = {}
        err.errors.forEach((e) => (map[e.path] = e.message))
        setErrors(map)
      }
      toast.error(err.message || 'Could not update profile')
    },
  })

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!name.trim()) next.name = 'Name is required'
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email address'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    mutation.mutate({ name: name.trim(), email: email.trim() })
  }

  if (isLoading) {
    return <div className="h-72 animate-pulse rounded-xl bg-muted" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate className="max-w-md space-y-4">
          <div>
            <Label htmlFor="p-name">Full name</Label>
            <Input
              id="p-name"
              className="mt-1.5"
              value={name}
              autoComplete="name"
              aria-invalid={!!errors.name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
          </div>
          <div>
            <Label htmlFor="p-email">Email</Label>
            <Input
              id="p-email"
              type="email"
              className="mt-1.5"
              value={email}
              autoComplete="email"
              aria-invalid={!!errors.email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
          </div>
          <div>
            <Label htmlFor="p-phone">Mobile number</Label>
            <div className="mt-1.5 flex items-stretch gap-2">
              <span className="inline-flex h-11 shrink-0 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                {profile?.countryCode || '+91'}
              </span>
              <Input id="p-phone" value={profile?.mobile || ''} readOnly disabled autoComplete="tel-national" />
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <Badge variant="success">
                {profile?.mobileVerified ? 'Verified' : 'Unverified'}
              </Badge>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Smartphone className="h-3 w-3" aria-hidden="true" />
                Your login number — verified via OTP.
              </p>
            </div>
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {mutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
