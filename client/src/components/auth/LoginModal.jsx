import * as React from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Smartphone } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { sendOtpSchema, otpSchema, COUNTRY_CODE } from '@/schemas/auth'
import { authApi } from '@/services/auth'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const RESEND_DELAY_SECONDS = 30

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
    defaultValues: { countryCode: COUNTRY_CODE, mobile: '', terms: false },
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
              onNavigate={close}
            />
          ) : (
            <OtpStep
              form={otpForm}
              verifying={verifying}
              resendCountdown={resendCountdown}
              sendingOtp={sendingOtp}
              otpValid={otpValid}
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

function PhoneStep({ form, sendingOtp, phoneValid, onSendOtp, onNavigate }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = form
  const terms = watch('terms')

  return (
    <form onSubmit={handleSubmit(onSendOtp)} noValidate className="flex flex-col">
      <div className="mb-6 flex justify-center">
        <img
          src="/logo.jpg"
          alt="24x7Chhutti"
          className="h-14 w-auto object-contain"
        />
      </div>
      <h2 className="text-center text-2xl font-bold tracking-tight">Login or Sign Up</h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Enter your mobile number to get started
      </p>

      <div className="mt-6">
        <Label htmlFor="mobile">Mobile number</Label>
        <div className="mt-1.5 flex items-stretch gap-2">
          <span className="inline-flex h-11 shrink-0 items-center rounded-md border border-input bg-muted px-3 text-sm font-medium text-muted-foreground">
            {COUNTRY_CODE}
          </span>
          <Input
            id="mobile"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            placeholder="98765 43210"
            aria-invalid={!!errors.mobile}
            {...register('mobile')}
          />
        </div>
        {errors.mobile && (
          <p className="mt-1.5 text-xs text-destructive">{errors.mobile.message}</p>
        )}
      </div>

      <label className="mt-4 flex items-start gap-2.5 text-xs text-muted-foreground">
        <Checkbox
          className="mt-0.5"
          checked={terms}
          onCheckedChange={(v) => setValue('terms', v, { shouldValidate: true })}
        />
        <span>
          I agree to the{' '}
          <Link
            to="/terms-and-conditions"
            onClick={onNavigate}
            className="font-medium text-primary hover:underline"
          >
            Terms &amp; Conditions
          </Link>{' '}
          and{' '}
          <Link
            to="/privacy-policy"
            onClick={onNavigate}
            className="font-medium text-primary hover:underline"
          >
            Privacy Policy
          </Link>
        </span>
      </label>
      {errors.terms && (
        <p className="mt-1.5 text-xs text-destructive">{errors.terms.message}</p>
      )}

      <Button
        type="submit"
        size="lg"
        className="mt-6 w-full"
        disabled={!phoneValid || sendingOtp}
      >
        {sendingOtp ? <Loader2 className="animate-spin" /> : <Smartphone />}
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
      <div className="mb-6 flex justify-center">
        <img
          src="/logo.jpg"
          alt="24x7Chhutti"
          className="h-14 w-auto object-contain"
        />
      </div>
      <h2 className="text-center text-2xl font-bold tracking-tight">Verify OTP</h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Enter the 6-digit code sent to{' '}
        <span className="font-medium text-foreground">+91 {mobile}</span>
      </p>

      <div className="mt-6">
        <Label htmlFor="otp">OTP</Label>
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          className="mt-1.5 text-center text-lg tracking-[0.4em]"
          aria-invalid={!!errors.otp}
          {...register('otp')}
        />
        {errors.otp && <p className="mt-1.5 text-xs text-destructive">{errors.otp.message}</p>}
      </div>

      <Button
        type="submit"
        size="lg"
        className="mt-6 w-full"
        disabled={!otpValid || verifying}
      >
        {verifying ? <Loader2 className="animate-spin" /> : null}
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
