import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, ChevronDown } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { sendOtpSchema, otpSchema, COUNTRY_CODE } from '@/schemas/auth'
import { authApi } from '@/services/auth'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const RESEND_DELAY_SECONDS = 30

// Popular calling codes; India is the default. `iso` drives the flag image
// (flagcdn.com) because Windows does not render flag emoji glyphs.
const COUNTRIES = [
  { code: '+91', iso: 'in', name: 'India' },
  { code: '+1', iso: 'us', name: 'USA / Canada' },
  { code: '+44', iso: 'gb', name: 'United Kingdom' },
  { code: '+971', iso: 'ae', name: 'UAE' },
  { code: '+65', iso: 'sg', name: 'Singapore' },
  { code: '+61', iso: 'au', name: 'Australia' },
  { code: '+966', iso: 'sa', name: 'Saudi Arabia' },
  { code: '+880', iso: 'bd', name: 'Bangladesh' },
  { code: '+49', iso: 'de', name: 'Germany' },
  { code: '+33', iso: 'fr', name: 'France' },
]

function Flag({ iso, name }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      srcSet={`https://flagcdn.com/w80/${iso}.png 2x`}
      alt={name}
      className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover"
      loading="lazy"
    />
  )
}

function CountrySelect({ value, onChange }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)

  React.useEffect(() => {
    if (!open) return undefined
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const current = COUNTRIES.find((c) => c.code === value) || COUNTRIES[0]

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select country code"
        className="flex h-full items-center gap-1 rounded-l-full pl-4 pr-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
      >
        <Flag iso={current.iso} name={current.name} />
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        <span>{current.code}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute bottom-full left-0 z-20 mb-2 max-h-56 w-56 overflow-auto rounded-xl border border-border bg-background py-1 shadow-lg"
        >
          {COUNTRIES.map((c) => (
            <li key={`${c.code}-${c.name}`}>
              <button
                type="button"
                role="option"
                aria-selected={c.code === value}
                onClick={() => {
                  onChange(c.code)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-muted',
                  c.code === value && 'bg-muted/60 font-medium'
                )}
              >
                <Flag iso={c.iso} name={c.name} />
                <span className="flex-1 text-left">{c.name}</span>
                <span className="text-muted-foreground">{c.code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function LoginModal({ open, onOpenChange }) {
  const [step, setStep] = React.useState('phone') // 'phone' | 'otp'
  const [phoneContext, setPhoneContext] = React.useState(null)
  const [resendCountdown, setResendCountdown] = React.useState(0)
  const [sendingOtp, setSendingOtp] = React.useState(false)
  const [verifying, setVerifying] = React.useState(false)
  const { setAuthenticated } = useAuth()

  const phoneForm = useForm({
    mode: 'onChange',
    resolver: zodResolver(sendOtpSchema),
    defaultValues: { countryCode: COUNTRY_CODE, mobile: '' },
  })

  const otpForm = useForm({
    mode: 'onChange',
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  })

  const close = React.useCallback(() => {
    onOpenChange(false)
    // Reset on next open is handled by mount effect below.
  }, [onOpenChange])

  React.useEffect(() => {
    if (open) {
      setStep('phone')
      phoneForm.reset()
      otpForm.reset()
      setPhoneContext(null)
      setResendCountdown(0)
    }
  }, [open, phoneForm, otpForm])

  React.useEffect(() => {
    if (resendCountdown <= 0) return undefined
    const id = setInterval(() => setResendCountdown((v) => v - 1), 1000)
    return () => clearInterval(id)
  }, [resendCountdown])

  const startCountdown = () => setResendCountdown(RESEND_DELAY_SECONDS)

  async function handleSendOtp(values) {
    setSendingOtp(true)
    try {
      await authApi.sendOtp({ countryCode: values.countryCode, mobile: values.mobile })
      setPhoneContext({ countryCode: values.countryCode, mobile: values.mobile })
      otpForm.reset()
      setStep('otp')
      startCountdown()
      toast.success('OTP sent to your mobile number')
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP')
    } finally {
      setSendingOtp(false)
    }
  }

  async function handleVerifyOtp(values) {
    if (!phoneContext) return
    setVerifying(true)
    try {
      const { data } = await authApi.verifyOtp({
        countryCode: phoneContext.countryCode,
        mobile: phoneContext.mobile,
        otp: values.otp,
      })
      setAuthenticated(data.data.user)
      toast.success('Logged in successfully')
      onOpenChange(false)
    } catch (err) {
      toast.error(err.message || 'Verification failed')
      otpForm.setError('otp', { message: err.message || 'Invalid OTP' })
    } finally {
      setVerifying(false)
    }
  }

  async function handleResend() {
    if (!phoneContext || resendCountdown > 0) return
    setSendingOtp(true)
    try {
      await authApi.sendOtp({
        countryCode: phoneContext.countryCode,
        mobile: phoneContext.mobile,
      })
      startCountdown()
      toast.success('OTP resent')
    } catch (err) {
      toast.error(err.message || 'Failed to resend OTP')
    } finally {
      setSendingOtp(false)
    }
  }

  const phoneValid = phoneForm.formState.isValid
  const otpValid = otpForm.formState.isValid

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={close}>
        <div className="flex flex-col p-6 sm:p-8">
          {step === 'phone' ? (
            <PhoneStep
              form={phoneForm}
              sendingOtp={sendingOtp}
              phoneValid={phoneValid}
              onSendOtp={handleSendOtp}
            />
          ) : (
            <OtpStep
              form={otpForm}
              verifying={verifying}
              resendCountdown={resendCountdown}
              sendingOtp={sendingOtp}
              otpValid={otpValid}
              countryCode={phoneContext?.countryCode}
              mobile={phoneContext?.mobile}
              onChangeNumber={() => {
                setStep('phone')
                setPhoneContext(null)
              }}
              onVerifyOtp={handleVerifyOtp}
              onResend={handleResend}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PhoneStep({ form, sendingOtp, phoneValid, onSendOtp }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = form
  const countryCode = watch('countryCode')
  const isIndia = countryCode === '+91'

  return (
    <form onSubmit={handleSubmit(onSendOtp)} noValidate className="flex flex-col">
      <h2 className="text-center text-xl font-semibold tracking-tight">Login or Sign Up</h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">Enter your mobile number</p>

      <div className="mt-6">
        <div
          className={cn(
            'flex h-12 w-full items-center rounded-full border border-input bg-background transition-colors focus-within:ring-2 focus-within:ring-ring',
            errors.mobile && 'border-destructive'
          )}
        >
          <CountrySelect
            value={countryCode}
            onChange={(code) => setValue('countryCode', code, { shouldValidate: true })}
          />
          <Input
            id="mobile"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={isIndia ? 10 : 14}
            placeholder="Enter phone number"
            className="h-full flex-1 rounded-full border-0 bg-transparent pl-1 pr-4 text-[15px] shadow-none focus-visible:ring-0"
            aria-invalid={!!errors.mobile}
            {...register('mobile', {
              onChange: (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, isIndia ? 10 : 14)
              },
            })}
          />
        </div>
        {errors.mobile && (
          <p className="mt-1.5 text-xs text-destructive">{errors.mobile.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={!phoneValid || sendingOtp}
        className={cn(
          'mt-6 h-11 w-full rounded-full text-[15px] font-medium',
          !phoneValid && 'bg-gray-100 text-gray-400 hover:bg-gray-100'
        )}
      >
        {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {sendingOtp ? 'Sending...' : 'Send OTP'}
      </Button>
    </form>
  )
}

function OtpStep({
  form,
  verifying,
  resendCountdown,
  sendingOtp,
  otpValid,
  countryCode,
  mobile,
  onChangeNumber,
  onVerifyOtp,
  onResend,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form

  return (
    <form onSubmit={handleSubmit(onVerifyOtp)} noValidate className="flex flex-col">
      <h2 className="text-center text-xl font-semibold tracking-tight">Verify OTP</h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Enter the 6-digit code sent to{' '}
        <span className="font-medium text-foreground">
          {countryCode} {mobile}
        </span>
      </p>

      <div className="mt-6">
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          className="h-12 rounded-full text-center text-lg tracking-[0.4em]"
          aria-invalid={!!errors.otp}
          {...register('otp')}
        />
        {errors.otp && <p className="mt-1.5 text-xs text-destructive">{errors.otp.message}</p>}
      </div>

      <Button
        type="submit"
        disabled={!otpValid || verifying}
        className={cn(
          'mt-6 h-11 w-full rounded-full text-[15px] font-medium',
          !otpValid && 'bg-gray-100 text-gray-400 hover:bg-gray-100'
        )}
      >
        {verifying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {verifying ? 'Verifying...' : 'Verify OTP'}
      </Button>

      <div className="mt-4 flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">Didn't receive the code?</span>
          <button
            type="button"
            onClick={onResend}
            disabled={resendCountdown > 0 || sendingOtp}
            className={cn(
              'font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend OTP'}
          </button>
        </div>
        <button
          type="button"
          onClick={onChangeNumber}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Change phone number
        </button>
      </div>
    </form>
  )
}
