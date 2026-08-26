import * as React from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Phone, MapPin, Clock3, Send, MessageCircle, CheckCircle2, AlertCircle } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSeo } from '@/lib/seo'
import { toast } from 'sonner'

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Name too long'),
  email: z.string().trim().email('Enter a valid email address').max(120),
  phone: z.string().trim().min(8, 'Enter a valid phone number').max(20).regex(/^[0-9+\-\s()]+$/, 'Phone contains invalid characters').optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000, 'Message too long'),
})

export function ContactPage() {
  useSeo({
    title: 'Contact Us',
    description: 'Contact 24x7Chhutti — support available 24x7 for trip enquiries, bookings and help.',
    canonical: `${window.location.origin}/contact`,
  })

  const [submitted, setSubmitted] = React.useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', phone: '', message: '' },
  })

  function onSubmit(values) {
    // No backend email infra — frontend-only handling per Phase 19 spec.
    // Show success state; in production this would POST to /api/enquiries or similar.
    setSubmitted(true)
    toast.success('Message received — we will get back to you soon.')
    reset()
    // Auto-hide success after a few seconds so form is reusable.
    setTimeout(() => setSubmitted(false), 5000)
  }

  return (
    <Container className="py-10 lg:py-14">
      <nav aria-label="Breadcrumb" className="mx-auto max-w-5xl text-sm text-muted-foreground">
        <ol className="flex items-center gap-1.5">
          <li><Link to="/" className="hover:text-foreground hover:underline">Home</Link></li>
          <li aria-hidden="true" className="text-muted-foreground/60">/</li>
          <li aria-current="page" className="font-medium text-foreground">Contact Us</li>
        </ol>
      </nav>
      {/* Header */}
      <div className="mx-auto mt-6 max-w-3xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
          <MessageCircle className="h-3.5 w-3.5" /> Contact 24x7Chhutti
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">We are here to help</h1>
        <p className="mt-2 text-muted-foreground">Questions about trips, dates, pricing or custom plans? Reach out — our team is available 24×7.</p>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.25fr]">
        {/* Contact info */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-base font-semibold">Contact information</h2>
            <p className="mt-1 text-sm text-muted-foreground">Use any of the options below — we will respond as soon as possible.</p>
            <ul className="mt-6 space-y-4 text-sm">
              <li className="flex gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-muted text-primary"><Phone className="h-4 w-4" /></span>
                <span>
                  <span className="font-medium">Customer support</span><br />
                  <span className="text-muted-foreground">Available 24×7</span>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-muted text-primary"><Mail className="h-4 w-4" /></span>
                <span>
                  <span className="font-medium">Email</span><br />
                  <span className="text-muted-foreground">support@24x7chhutti.com</span>
                  <span className="block text-xs text-muted-foreground/80">(replies within 24 hours)</span>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-muted text-primary"><MapPin className="h-4 w-4" /></span>
                <span>
                  <span className="font-medium">Location</span><br />
                  <span className="text-muted-foreground">India — trips across domestic, international & weekend destinations</span>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-muted text-primary"><Clock3 className="h-4 w-4" /></span>
                <span>
                  <span className="font-medium">Hours</span><br />
                  <span className="text-muted-foreground">Every day, around the clock</span>
                </span>
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/faqs" className="text-sm font-medium text-primary hover:underline">Visit FAQs</Link>
              <span className="text-muted-foreground">·</span>
              <Link to="/about" className="text-sm font-medium text-primary hover:underline">About us</Link>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-muted/40 p-6">
            <h3 className="text-sm font-semibold">Prefer to browse?</h3>
            <p className="mt-1 text-sm text-muted-foreground">Find answers without waiting.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/trips"><Button variant="outline" size="sm">Browse trips</Button></Link>
              <Link to="/destinations"><Button variant="outline" size="sm">Destinations</Button></Link>
              <Link to="/blogs"><Button variant="outline" size="sm">Travel blogs</Button></Link>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card lg:p-8">
          <h2 className="text-lg font-semibold">Send us a message</h2>
          <p className="mt-1 text-sm text-muted-foreground">We will get back to you on the email you provide.</p>

          {submitted && (
            <div role="status" aria-live="polite" className="mt-5 flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
              <div>
                <p className="font-medium">Thanks for reaching out!</p>
                <p className="mt-1 text-green-800/80">Your message has been noted. Our team will respond shortly. For urgent booking help, try our 24×7 support line.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-5">
            <div>
              <Label htmlFor="contact-name">Name <span className="text-destructive">*</span></Label>
              <Input id="contact-name" autoComplete="name" placeholder="Your full name" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'contact-name-error' : undefined} {...register('name')} className="mt-1.5" />
              {errors.name && <p id="contact-name-error" role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-destructive"><AlertCircle className="h-3 w-3" />{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="contact-email">Email <span className="text-destructive">*</span></Label>
              <Input id="contact-email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'contact-email-error' : undefined} {...register('email')} className="mt-1.5" />
              {errors.email && <p id="contact-email-error" role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-destructive"><AlertCircle className="h-3 w-3" />{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="contact-phone">Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="contact-phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'contact-phone-error' : undefined} {...register('phone')} className="mt-1.5" />
              {errors.phone && <p id="contact-phone-error" role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-destructive"><AlertCircle className="h-3 w-3" />{errors.phone.message}</p>}
            </div>

            <div>
              <Label htmlFor="contact-message">Message <span className="text-destructive">*</span></Label>
              <Textarea id="contact-message" placeholder="How can we help you? Include trip name, dates or booking code if relevant." rows={5} aria-invalid={!!errors.message} aria-describedby={errors.message ? 'contact-message-error' : undefined} {...register('message')} className="mt-1.5 min-h-[120px]" />
              {errors.message && <p id="contact-message-error" role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-destructive"><AlertCircle className="h-3 w-3" />{errors.message.message}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
              {isSubmitting ? 'Sending…' : <><Send className="h-4 w-4" /> Send message</>}
            </Button>
            <p className="text-center text-xs text-muted-foreground">By sending, you agree to our <Link to="/privacy-policy" className="underline hover:text-foreground">Privacy Policy</Link>.</p>
          </form>
        </div>
      </div>
    </Container>
  )
}
