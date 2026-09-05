import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, ChevronDown } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { sendOtpSchema, otpSchema, COUNTRY_CODE, INDIAN_MOBILE_PATTERN, INTERNATIONAL_MOBILE_PATTERN, OTP_PATTERN } from '@/schemas/auth'
import { COUNTRIES } from '@/lib/countries'
import { authApi } from '@/services/auth'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const RESEND_DELAY_SECONDS = 30

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
        className="flex h-full items-center gap-1 rounded-l-full pl-4 pr-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none"
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

  // mode 'onSubmit': RHF never surfaces its own errors during typing or
  // blurs. Error visibility and button state are DERIVED from the watched
  // value below (single source of truth: the schema patterns), so they update
  // reactively on every keystroke without any click.
  const phoneForm = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    resolver: zodResolver(sendOtpSchema),
    defaultValues: { countryCode: COUNTRY_CODE, mobile: '' },
  })

  const otpForm = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  })

  // Derived phone state (never stored in separate mutable state).
  const watchedCountryCode = phoneForm.watch('countryCode')
  const watchedMobile = phoneForm.watch('mobile')
  const isIndia = watchedCountryCode === '+91'
  const mobileDigits = (watchedMobile || '').replace(/\D/g, '')
  const isValidPhone = isIndia
    ? INDIAN_MOBILE_PATTERN.test(mobileDigits)
    : INTERNATIONAL_MOBILE_PATTERN.test(mobileDigits)
  // Error only for a COMPLETE but invalid number. Empty or incomplete input
  // stays silent — even on focus or blur.
  const phoneInvalid = isIndia
    ? mobileDigits.length === 10 && !isValidPhone
    : false

  // Derived OTP state: exactly 6 digits.
  const watchedOtp = otpForm.watch('otp')
  const isValidOtp = OTP_PATTERN.test(watchedOtp || '')

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
      // Clear the wrong code so the user retypes it. `setValue` (unlike
      // `resetField`) keeps the server error message visible; `isValid`
      // re-evaluates so Verify stays disabled until 6 fresh digits.
      otpForm.setValue('otp', '', { shouldValidate: false, shouldDirty: true })
      otpForm.setError('otp', { message: err.message || 'Invalid OTP' })
      otpForm.setFocus('otp')
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

  const phoneValid = isValidPhone
  const otpValid = isValidOtp

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={close}>
        <div className="flex flex-col p-6 sm:p-8">
          {step === 'phone' ? (
            <PhoneStep
              form={phoneForm}
              sendingOtp={sendingOtp}
              phoneValid={phoneValid}
              phoneInvalid={phoneInvalid}
              isIndia={isIndia}
              onSendOtp={handleSendOtp}
            />
          ) : (
            <OtpStep
              form={otpForm}
              otp={watchedOtp}
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

function PhoneStep({ form, sendingOtp, phoneValid, phoneInvalid, isIndia, onSendOtp }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
  } = form
  const countryCode = watch('countryCode')

  return (
    <form onSubmit={handleSubmit(onSendOtp)} noValidate className="flex flex-col">
      <h2 className="text-center text-xl font-semibold tracking-tight">Login or Sign Up</h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">Enter your mobile number</p>

      <div className="mt-6">
        {/* The pill keeps ONE constant border — no focus-state change. Inner
            sections (flag/select, code, input) are borderless and
            outline-free so no nested focus ring can appear. */}
        <div
          className={cn(
            'flex h-12 w-full items-center rounded-full border border-input bg-background transition-colors',
            phoneInvalid && 'border-destructive'
          )}
        >
          <CountrySelect
            value={countryCode}
            onChange={(code) => setValue('countryCode', code, { shouldValidate: true })}
          />
          <Input
            id="mobile"
            inputMode="numeric"
            // autoComplete off: Chrome treats tel-national as an address autofill
            // target — its dropdown + autofill background paint a square fill
            // that ignores the pill radius and clips the border.
            autoComplete="off"
            maxLength={isIndia ? 10 : 14}
            placeholder="Enter phone number"
            className="h-full flex-1 rounded-full border-0 bg-transparent pl-1 pr-4 text-[15px] shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            {...register('mobile', {
              onChange: (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, isIndia ? 10 : 14)
              },
            })}
          />
        </div>
        {phoneInvalid && (
          <p className="mt-1.5 text-xs text-destructive">Enter a valid mobile number</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={!phoneValid || sendingOtp}
        className={cn(
          'mt-6 h-11 w-full rounded-full text-[15px] font-medium',
          !phoneValid && 'border border-gray-300 bg-white text-gray-500 hover:bg-white'
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
  otp,
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
  const [otpFocused, setOtpFocused] = React.useState(false)

  // Segmented display: filled slots show their digit, empty slots show a
  // short dash; the next-to-fill slot highlights while the input is focused.
  const slots = Array.from({ length: 6 }, (_, i) => otp[i] || '')
  const activeSlot = Math.min(otp.length, 5)

  return (
    <form onSubmit={handleSubmit(onVerifyOtp)} noValidate className="flex flex-col">
      <h2 className="text-center text-xl font-semibold tracking-tight">Login or Sign Up</h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Enter the 6-digit code sent to{' '}
        <span className="font-medium text-foreground">
          {countryCode} {mobile}
        </span>
      </p>

      <div className="relative mt-6">
        {/* Visible slot strip — purely presentational (aria-hidden).
            Dashes sit at the bottom of each cell (underline style); typed
            digits render centered above them. */}
        <div aria-hidden="true" className="flex h-12 w-full items-stretch justify-center gap-1 rounded-full border border-input bg-background px-4">
          {slots.map((ch, i) => (
            <div key={i} className="relative flex h-full w-7 items-center justify-center">
              {ch ? (
                <span className="text-lg font-medium">{ch}</span>
              ) : (
                <span
                  className={cn(
                    'absolute bottom-2.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full transition-colors',
                    otpFocused && i === activeSlot ? 'bg-foreground/70' : 'bg-muted-foreground/40'
                  )}
                />
              )}
            </div>
          ))}
        </div>
        {/* The real input sits invisibly on top — typing, backspace, paste and
            focus all behave exactly as before. Digits-only sanitizer. */}
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder=""
          aria-label="Enter 6-digit OTP"
          autoFocus
          className="absolute inset-0 h-full w-full cursor-pointer rounded-full border-0 bg-transparent text-center text-lg opacity-0 shadow-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-invalid={!!errors.otp}
          onFocus={() => setOtpFocused(true)}
          onBlur={() => setOtpFocused(false)}
          {...register('otp', {
            onChange: (e) => {
              e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6)
            },
          })}
        />
      </div>
      {errors.otp && <p className="mt-1.5 text-xs text-destructive">{errors.otp.message}</p>}

      <Button
        type="submit"
        disabled={!otpValid || verifying}
        className={cn(
          'mt-6 h-11 w-full rounded-full text-[15px] font-medium',
          !otpValid && 'border border-gray-300 bg-white text-gray-500 hover:bg-white'
        )}
      >
        {verifying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        Login
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
