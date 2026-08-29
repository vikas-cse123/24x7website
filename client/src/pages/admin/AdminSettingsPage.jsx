import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  UploadCloud,
  Loader2,
  RotateCcw,
  X,
  AlertTriangle,
  Save,
  Megaphone,
  Phone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { adminBrandingApi, adminSettingsApi } from '@/services/settings'
import { BRANDING_QUERY_KEY } from '@/hooks/useBranding'
import { PUBLIC_SETTINGS_QUERY_KEY } from '@/hooks/usePublicSettings'
import { DEFAULT_PROMOTIONAL_BANNER } from '@/lib/settings'
import { BRAND_NAME } from '@/lib/branding'
import { cn } from '@/lib/utils'

const ADMIN_SETTINGS_QUERY_KEY = ['admin', 'settings']

const MAX_LOGO_SIZE_MB = 5
const SUPPORTED_FORMATS = 'JPG, JPEG, PNG, WebP'

function ToggleField({ label, description, checked, onCheckedChange, disabled }) {
  return (
    <label className={cn('flex items-start gap-3', disabled && 'opacity-60')}>
      <Checkbox
        className="mt-0.5"
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-muted-foreground">{description}</span>}
      </span>
    </label>
  )
}

function ConfirmResetDialog({ open, onOpenChange, onConfirm, pending }) {
  if (!open) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold">Reset logo to default?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This removes the custom logo. The website will use the default
            {` ${BRAND_NAME}`} logo (<code className="rounded bg-muted px-1">/logo.jpg</code>).
            This can be undone by uploading a new logo.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button variant="destructive" onClick={onConfirm} disabled={pending}>
              {pending ? 'Working…' : 'Reset to Default'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AdminSettingsPage() {
  const queryClient = useQueryClient()
  const inputRef = React.useRef(null)
  const [selectedFile, setSelectedFile] = React.useState(null)
  const [previewUrl, setPreviewUrl] = React.useState(null)
  const [resetOpen, setResetOpen] = React.useState(false)

  const [contactForm, setContactForm] = React.useState({ phone: '', showPhoneInHeader: false })
  const [bannerForm, setBannerForm] = React.useState({ ...DEFAULT_PROMOTIONAL_BANNER })

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ADMIN_SETTINGS_QUERY_KEY,
    queryFn: () => adminSettingsApi.getAll(),
  })
  const settings = data?.data?.data
  const activeLogo = settings?.branding?.logo

  // Sync form state once settings load.
  React.useEffect(() => {
    if (!settings) return
    setContactForm({
      phone: settings.contact?.phone ?? '',
      showPhoneInHeader: settings.contact?.showPhoneInHeader ?? false,
    })
    setBannerForm({ ...DEFAULT_PROMOTIONAL_BANNER, ...settings.promotionalBanner })
  }, [settings])

  // Revoke the object URL on unmount to avoid leaks.
  React.useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function clearSelection() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(null)
    setPreviewUrl(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: BRANDING_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: PUBLIC_SETTINGS_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: ADMIN_SETTINGS_QUERY_KEY })
  }

  const saveLogoMutation = useMutation({
    mutationFn: () => {
      const form = new FormData()
      form.append('image', selectedFile)
      form.append('alt', BRAND_NAME)
      return adminBrandingApi.uploadLogo(form)
    },
    onSuccess: () => {
      toast.success('Logo updated — now live across the website')
      clearSelection()
      invalidate()
    },
    onError: (err) => {
      // Retain the currently active logo; never save a broken URL.
      if (err.response?.status === 503) {
        toast.error(
          'Cloudinary is not configured. Persistent logo uploads require the Cloudinary environment variables.'
        )
      } else {
        toast.error(err.response?.data?.message || err.message || 'Upload failed')
      }
    },
  })

  const resetLogoMutation = useMutation({
    mutationFn: () => adminBrandingApi.reset(),
    onSuccess: () => {
      toast.success('Branding reset to the default logo')
      setResetOpen(false)
      clearSelection()
      invalidate()
    },
    onError: (err) => toast.error(err.message || 'Reset failed'),
  })

  const contactMutation = useMutation({
    mutationFn: () => adminSettingsApi.updateContact(contactForm),
    onSuccess: () => {
      toast.success('Contact information saved')
      invalidate()
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Save failed'),
  })

  const bannerMutation = useMutation({
    mutationFn: () => adminSettingsApi.updatePromotionalBanner(bannerForm),
    onSuccess: () => {
      toast.success('Promotional banner saved')
      invalidate()
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Save failed'),
  })

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Settings</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Manage website-wide branding, contact information and the promotional banner.
      </p>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : isError ? (
        <Card className="border-destructive/40 p-6 text-sm text-destructive">
          Could not load settings. {error?.message || 'Please try again.'}
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Website logo — shown in the header, mobile menu, login/signup, footer and image fallbacks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings?.branding?.cloudinaryConfigured === false && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p>
                    Cloudinary is not configured. Uploading a new logo requires the
                    Cloudinary environment variables (<code className="rounded bg-amber-100 px-1">CLOUDINARY_*</code>)
                    to be set on the server.
                  </p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="flex h-24 w-40 items-center justify-center rounded-lg border border-border bg-muted/50 p-3">
                  <img
                    src={activeLogo?.url}
                    alt={activeLogo?.alt || BRAND_NAME}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div>
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    Current logo
                    {activeLogo?.isCustom ? (
                      <Badge variant="success">Custom</Badge>
                    ) : (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activeLogo?.alt || BRAND_NAME}
                    {activeLogo?.isCustom && activeLogo?.updatedAt
                      ? ` — updated ${new Date(activeLogo.updatedAt).toLocaleString()}`
                      : ' — using the built-in default logo'}
                  </p>
                  {activeLogo?.isCustom && activeLogo?.publicId && (
                    <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{activeLogo.publicId}</p>
                  )}
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <label
                  htmlFor="logo-upload"
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors',
                    'border-border hover:border-primary/50'
                  )}
                >
                  <UploadCloud className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  <p className="mt-2 text-sm font-medium">Upload New Logo</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Supported: {SUPPORTED_FORMATS} · Maximum size: {MAX_LOGO_SIZE_MB} MB
                  </p>
                </label>
                <input
                  ref={inputRef}
                  id="logo-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {selectedFile && previewUrl && (
                  <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/40 p-4">
                    <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded-md border border-border bg-background p-2">
                      <img src={previewUrl} alt="New logo preview" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        Preview <Badge variant="warning">Not saved yet</Badge>
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {selectedFile.name} · {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={clearSelection}>
                      <X className="h-4 w-4" aria-hidden="true" /> Cancel
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
                <Button onClick={() => saveLogoMutation.mutate()} disabled={!selectedFile || saveLogoMutation.isPending}>
                  {saveLogoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UploadCloud className="h-4 w-4" aria-hidden="true" />}
                  {saveLogoMutation.isPending ? 'Saving…' : 'Save Logo'}
                </Button>
                {activeLogo?.isCustom && (
                  <Button type="button" variant="outline" onClick={() => setResetOpen(true)} disabled={resetLogoMutation.isPending}>
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    Reset to Default
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Phone number shown in the header (logo / search / phone / Login row).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:max-w-sm">
                <Label htmlFor="contact-phone">Phone number</Label>
                <Input
                  id="contact-phone"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
              </div>
              <ToggleField
                label="Show in header"
                description="Display the phone number in the main header row."
                checked={contactForm.showPhoneInHeader}
                onCheckedChange={(v) => setContactForm((f) => ({ ...f, showPhoneInHeader: !!v }))}
              />
              <div className="flex items-center gap-3 border-t border-border pt-4">
                <Button onClick={() => contactMutation.mutate()} disabled={contactMutation.isPending}>
                  {contactMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
                  {contactMutation.isPending ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Promotional Banner */}
          <Card>
            <CardHeader>
              <CardTitle>Promotional Banner</CardTitle>
              <CardDescription>The full-width announcement bar at the very top of the website (above the header).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="banner-message">Message</Label>
                  <Input
                    id="banner-message"
                    value={bannerForm.message}
                    onChange={(e) => setBannerForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder={DEFAULT_PROMOTIONAL_BANNER.message}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="banner-cta-text">Button Text</Label>
                  <Input
                    id="banner-cta-text"
                    value={bannerForm.ctaText}
                    onChange={(e) => setBannerForm((f) => ({ ...f, ctaText: e.target.value }))}
                    placeholder={DEFAULT_PROMOTIONAL_BANNER.ctaText}
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="banner-cta-url">Button URL</Label>
                  <Input
                    id="banner-cta-url"
                    value={bannerForm.ctaUrl}
                    onChange={(e) => setBannerForm((f) => ({ ...f, ctaUrl: e.target.value }))}
                    placeholder="/trips"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use an internal path (e.g. <code className="rounded bg-muted px-1">/trips</code>) or a full http(s) URL.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <ToggleField
                  label="Show banner"
                  description="Globally show/hide the promotional banner."
                  checked={bannerForm.enabled}
                  onCheckedChange={(v) => setBannerForm((f) => ({ ...f, enabled: !!v }))}
                />
                <ToggleField
                  label="Shimmer effect"
                  description="Subtle white light sweep moving left → right."
                  checked={bannerForm.shimmerEnabled}
                  onCheckedChange={(v) => setBannerForm((f) => ({ ...f, shimmerEnabled: !!v }))}
                />
              </div>

              {/* Live preview */}
              <div className="border-t border-border pt-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Megaphone className="h-3.5 w-3.5" aria-hidden="true" /> Preview
                </p>
                <div
                  className={cn('relative overflow-hidden rounded-md bg-primary text-primary-foreground')}
                  style={{
                    ...(bannerForm.backgroundColor ? { backgroundColor: bannerForm.backgroundColor } : {}),
                    ...(bannerForm.textColor ? { color: bannerForm.textColor } : {}),
                  }}
                >
                  {bannerForm.shimmerEnabled && <div className="banner-shimmer" aria-hidden="true" />}
                  <div className="relative z-10 flex min-h-9 items-center justify-center gap-2 px-8 py-1.5 text-xs font-medium">
                    <span className="truncate">{bannerForm.message || DEFAULT_PROMOTIONAL_BANNER.message}</span>
                    <span className="shrink-0 font-semibold underline underline-offset-2">
                      {bannerForm.ctaText || DEFAULT_PROMOTIONAL_BANNER.ctaText}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-border pt-4">
                <Button onClick={() => bannerMutation.mutate()} disabled={bannerMutation.isPending}>
                  {bannerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
                  {bannerMutation.isPending ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmResetDialog
        open={resetOpen}
        onOpenChange={(o) => !o && setResetOpen(false)}
        onConfirm={() => resetLogoMutation.mutate()}
        pending={resetLogoMutation.isPending}
      />
    </div>
  )
}