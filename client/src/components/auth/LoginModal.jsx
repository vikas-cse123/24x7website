import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, emailOtpSchema } from '@/schemas/auth'
import { authApi } from '@/services/auth'
import { useAuth } from '@/hooks/useAuth'

const RESEND_DELAY = 30

const OtpInput = React.forwardRef(function OtpInput({ value, onChange, autoFocus }, ref) {
  const [focused, setFocused] = React.useState(false)
  const innerRef = React.useRef(null)
  React.useImperativeHandle(ref, () => ({
    focus: () => innerRef.current?.focus(),
  }))
  const slots = Array.from({ length: 6 }, (_, i) => value[i] || '')
  const active = Math.min(value.length, 5)
  return (
    <div className="relative mt-3">
      <div aria-hidden="true" className="flex h-12 w-full items-stretch justify-center gap-1 rounded-md border border-input bg-background px-3">
        {slots.map((ch, i) => (
          <div key={i} className="relative flex h-full w-7 items-center justify-center">
            {ch ? <span className="text-lg font-medium">{ch}</span> : <span className={`absolute bottom-2.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full ${focused && i === active ? 'bg-foreground/70' : 'bg-muted-foreground/40'}`} />}
          </div>
        ))}
      </div>
      <input
        ref={innerRef}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label="Enter 6-digit OTP"
        className="absolute inset-0 h-full w-full cursor-pointer rounded-md border-0 bg-transparent text-center text-lg opacity-0 focus-visible:outline-none"
      />
    </div>
  )
})

export function LoginModal({ open, onOpenChange }) {
  const [view, setView] = React.useState('login') // login, signup, verifySignup, forgot, verifyReset, resetPassword, success
  const [verifyEmail, setVerifyEmail] = React.useState('')
  const [resetEmail, setResetEmail] = React.useState('')
  const [resendCountdown, setResendCountdown] = React.useState(0)
  const [successMessage, setSuccessMessage] = React.useState('')
  const { setAuthenticated } = useAuth()

  const close = React.useCallback(() => onOpenChange(false), [onOpenChange])

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setView('login')
      setVerifyEmail('')
      setResetEmail('')
      setSuccessMessage('')
      setResendCountdown(0)
    }
  }, [open])

  React.useEffect(() => {
    if (resendCountdown <= 0) return
    const id = setInterval(() => setResendCountdown((v) => v - 1), 1000)
    return () => clearInterval(id)
  }, [resendCountdown])

  const startCountdown = () => setResendCountdown(RESEND_DELAY)

  // Forms
  const signupForm = useForm({ resolver: zodResolver(signupSchema), defaultValues: { name: '', email: '', phone: '', countryCode: '+91', password: '' } })
  const loginForm = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })
  const forgotForm = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } })
  const resetForm = useForm({ resolver: zodResolver(resetPasswordSchema), defaultValues: { email: '', newPassword: '', confirmPassword: '' } })
  const [signupOtp, setSignupOtp] = React.useState('')
  const [resetOtp, setResetOtp] = React.useState('')
  const signupOtpRef = React.useRef(null)
  const resetOtpRef = React.useRef(null)
  const [showSignupPassword, setShowSignupPassword] = React.useState(false)
  const [showLoginPassword, setShowLoginPassword] = React.useState(false)
  const [showResetPassword, setShowResetPassword] = React.useState(false)
  const [showResetConfirm, setShowResetConfirm] = React.useState(false)

  const [loading, setLoading] = React.useState(false)

  // Height animation for login/signup switch — prevents jump between different form heights
  const containerRef = React.useRef(null)
  const loginRef = React.useRef(null)
  const signupRef = React.useRef(null)
  const [containerHeight, setContainerHeight] = React.useState(null)
  React.useEffect(() => {
    if (view !== 'login' && view !== 'signup') return
    const update = () => {
      const el = view === 'login' ? loginRef.current : signupRef.current
      if (el && containerRef.current) {
        // Use offsetHeight for accurate height including padding
        const h = el.getBoundingClientRect().height
        if (h > 0) setContainerHeight(h)
      }
    }
    // Defer to next frame so DOM has updated
    const id = requestAnimationFrame(() => requestAnimationFrame(update))
    update()
    return () => cancelAnimationFrame(id)
  }, [view])

  async function handleSignup(values) {
    setLoading(true)
    try {
      await authApi.signup(values)
      setVerifyEmail(values.email.trim().toLowerCase())
      setSignupOtp('')
      setView('verifySignup')
      startCountdown()
      toast.success('Account created. Verification code sent to your email.')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create account'
      toast.error(msg)
      if (msg.includes('already exists')) {
        // keep on signup but show error
      }
    } finally { setLoading(false) }
  }

  async function handleVerifySignup() {
    if (signupOtp.length !== 6) {
      toast.error('Enter a valid 6-digit OTP')
      return
    }
    setLoading(true)
    try {
      const { data } = await authApi.verifyEmail({ email: verifyEmail, otp: signupOtp })
      if (data?.data?.user) setAuthenticated(data.data.user)
      toast.success('Email verified successfully.')
      // Auto login if token was set (cookie), otherwise go to login
      if (data?.data?.user) {
        onOpenChange(false)
      } else {
        setSuccessMessage('Email verified successfully.')
        setView('success')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Invalid OTP')
      // Clear OTP and focus first input for retry
      setSignupOtp('')
      setTimeout(() => signupOtpRef.current?.focus(), 0)
    } finally { setLoading(false) }
  }

  async function handleResendSignup() {
    if (resendCountdown > 0) return
    setLoading(true)
    try {
      await authApi.resendVerification({ email: verifyEmail })
      startCountdown()
      toast.success('Verification code resent')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to resend')
    } finally { setLoading(false) }
  }

  async function handleLogin(values) {
    setLoading(true)
    try {
      const { data } = await authApi.login(values)
      setAuthenticated(data.data.user)
      toast.success('Logged in successfully')
      onOpenChange(false)
    } catch (err) {
      const res = err.response?.data
      const msg = res?.message || err.message || 'Login failed'
      if (res?.code === 'EMAIL_NOT_VERIFIED' || msg.includes('verify your email')) {
        toast.error('Please verify your email before logging in.')
        setVerifyEmail(values.email.trim().toLowerCase())
        setSignupOtp('')
        setView('verifySignup')
        startCountdown()
        // Try to resend automatically? Let user resend manually
      } else {
        toast.error(msg)
      }
    } finally { setLoading(false) }
  }

  async function handleForgot(values) {
    setLoading(true)
    try {
      await authApi.forgotPassword({ email: values.email })
      setResetEmail(values.email.trim().toLowerCase())
      setResetOtp('')
      setView('verifyReset')
      startCountdown()
      toast.success("If an account exists for this email, we've sent a verification code.")
      resetForm.setValue('email', values.email.trim().toLowerCase())
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  async function handleVerifyReset() {
    if (resetOtp.length !== 6) {
      toast.error('Enter a valid 6-digit OTP')
      return
    }
    setLoading(true)
    try {
      await authApi.verifyResetOtp({ email: resetEmail, otp: resetOtp })
      setView('resetPassword')
      toast.success('OTP verified. Please set a new password.')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Invalid OTP')
      setResetOtp('')
      setTimeout(() => resetOtpRef.current?.focus(), 0)
    } finally { setLoading(false) }
  }

  async function handleResendReset() {
    if (resendCountdown > 0) return
    setLoading(true)
    try {
      await authApi.resendPasswordReset({ email: resetEmail })
      startCountdown()
      toast.success("If an account exists for this email, we've sent a verification code.")
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to resend')
    } finally { setLoading(false) }
  }

  async function handleResetPassword(values) {
    // values contains email, newPassword, confirmPassword but we use resetEmail state
    const payload = {
      email: resetEmail,
      newPassword: values.newPassword,
      confirmPassword: values.confirmPassword,
    }
    setLoading(true)
    try {
      await authApi.resetPassword(payload)
      toast.success('Password reset successfully.')
      setSuccessMessage('Password reset successfully.')
      setView('success')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to reset password')
    } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={close} className="w-full max-w-[420px] p-0 overflow-hidden">
        <div className="max-h-[90vh] w-full overflow-y-auto p-6 sm:p-8">
          {(view === 'login' || view === 'signup') && (
            <div className="relative mb-6 flex h-12 w-full items-center rounded-full bg-muted p-1">
              <div
                aria-hidden="true"
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-primary shadow-sm transition-all duration-[250ms] ease-out motion-reduce:transition-none"
                style={{ left: view === 'login' ? '4px' : '50%' }}
              />
              <button
                type="button"
                onClick={() => setView('login')}
                className={`relative z-10 flex h-full w-1/2 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-200 ${view === 'login' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setView('signup')}
                className={`relative z-10 flex h-full w-1/2 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-200 ${view === 'signup' ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Sign Up
              </button>
            </div>
          )}
          {(view === 'login' || view === 'signup') && (
            <div
              ref={containerRef}
              className="relative overflow-hidden motion-reduce:!transition-none"
              style={{
                height: containerHeight ? `${containerHeight}px` : undefined,
                transition: 'height 250ms ease-out',
              }}
            >
              <div
                ref={loginRef}
                className={`transition-all duration-[250ms] ease-out motion-reduce:transition-none will-change-transform ${view === 'login' ? 'relative opacity-100 translate-y-0' : 'absolute inset-x-0 top-0 opacity-0 translate-y-2 pointer-events-none'}`}
              >
                <form onSubmit={loginForm.handleSubmit(handleLogin)} noValidate className="flex flex-col">
                  <h2 className="text-center text-xl font-semibold tracking-tight">Login</h2>
                <div className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="Enter your email" autoComplete="email" className="mt-1.5 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-input focus-visible:outline-none" {...loginForm.register('email')} />
                    {loginForm.formState.errors.email && <p className="mt-1 text-xs text-destructive">{loginForm.formState.errors.email.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative mt-1.5">
                      <Input id="login-password" type={showLoginPassword ? 'text' : 'password'} placeholder="Enter your password" autoComplete="current-password" className="pr-10 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-input focus-visible:outline-none" {...loginForm.register('password')} />
                      <button type="button" onClick={() => setShowLoginPassword((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showLoginPassword ? 'Hide password' : 'Show password'}>
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && <p className="mt-1 text-xs text-destructive">{loginForm.formState.errors.password.message}</p>}
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="mt-6 h-11 w-full">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Logging in...</> : 'Login'}
                </Button>
                <button type="button" onClick={() => setView('forgot')} className="mt-3 text-center text-sm text-primary hover:underline">Forgot password?</button>
              </form>
              </div>
              <div
                ref={signupRef}
                className={`transition-all duration-[250ms] ease-out motion-reduce:transition-none will-change-transform ${view === 'signup' ? 'relative opacity-100 translate-y-0' : 'absolute inset-x-0 top-0 opacity-0 -translate-y-2 pointer-events-none'}`}
              >
                <form onSubmit={signupForm.handleSubmit(handleSignup)} noValidate className="flex flex-col">
                  <h2 className="text-center text-xl font-semibold tracking-tight">Create your account</h2>
                <div className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="signup-name">Name *</Label>
                    <Input id="signup-name" placeholder="Enter your name" autoComplete="name" className="mt-1.5 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-input focus-visible:outline-none" {...signupForm.register('name')} />
                    {signupForm.formState.errors.name && <p className="mt-1 text-xs text-destructive">{signupForm.formState.errors.name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email *</Label>
                    <Input id="signup-email" type="email" placeholder="Enter your email" autoComplete="email" className="mt-1.5 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-input focus-visible:outline-none" {...signupForm.register('email')} />
                    {signupForm.formState.errors.email && <p className="mt-1 text-xs text-destructive">{signupForm.formState.errors.email.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="signup-phone">Phone *</Label>
                    <div className="mt-1.5 flex w-full items-stretch overflow-hidden rounded-md border border-input bg-background focus-within:outline-none focus-within:ring-0 focus-within:ring-offset-0 focus-within:border-input">
                      <span className="inline-flex h-10 shrink-0 items-center border-r border-input bg-muted px-3 text-sm text-muted-foreground">+91</span>
                      <Input
                        id="signup-phone"
                        inputMode="numeric"
                        placeholder="Enter phone number"
                        autoComplete="tel-national"
                        className="h-10 flex-1 min-w-0 rounded-none border-0 bg-transparent px-3 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        {...signupForm.register('phone', {
                          onChange: (e) => {
                            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)
                          },
                        })}
                      />
                    </div>
                    {signupForm.formState.errors.phone && <p className="mt-1 text-xs text-destructive">{signupForm.formState.errors.phone.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password *</Label>
                    <div className="relative mt-1.5">
                      <Input id="signup-password" type={showSignupPassword ? 'text' : 'password'} placeholder="Enter password" autoComplete="new-password" className="pr-10 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-input focus-visible:outline-none" {...signupForm.register('password')} />
                      <button type="button" onClick={() => setShowSignupPassword((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showSignupPassword ? 'Hide password' : 'Show password'}>
                        {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {signupForm.formState.errors.password && <p className="mt-1 text-xs text-destructive">{signupForm.formState.errors.password.message}</p>}
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="mt-6 h-11 w-full">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account...</> : 'Create Account'}
                </Button>
              </form>
              </div>
            </div>
          )}

          {view === 'verifySignup' && (
            <div className="flex flex-col">
              <h2 className="text-center text-xl font-semibold tracking-tight">Verify your email</h2>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                We&apos;ve sent a verification code to:<br /><span className="font-medium text-foreground">{verifyEmail}</span>
              </p>
              <p className="mt-4 text-center text-sm font-medium">Enter the 6-digit OTP</p>
              <OtpInput ref={signupOtpRef} value={signupOtp} onChange={setSignupOtp} autoFocus />
              <Button onClick={handleVerifySignup} disabled={loading || signupOtp.length !== 6} className="mt-6 h-11 w-full">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Verifying...</> : 'Verify Email'}
              </Button>
              <div className="mt-4 text-center">
                <button type="button" onClick={handleResendSignup} disabled={resendCountdown > 0 || loading} className="text-sm font-medium text-primary hover:underline disabled:opacity-50">
                  {resendCountdown > 0 ? `Resend OTP in ${resendCountdown}s` : 'Resend OTP'}
                </button>
              </div>
              <button type="button" onClick={() => setView('login')} className="mt-2 text-center text-sm text-muted-foreground hover:text-foreground">Back to Login</button>
            </div>
          )}

          {view === 'forgot' && (
            <form onSubmit={forgotForm.handleSubmit((v) => handleForgot(v))} noValidate className="flex flex-col">
              <h2 className="text-center text-xl font-semibold tracking-tight">Forgot password?</h2>
              <p className="mt-2 text-center text-sm text-muted-foreground">Enter your email and we&apos;ll send you a verification code.</p>
              <div className="mt-6">
                <Label htmlFor="forgot-email">Email</Label>
                <Input id="forgot-email" type="email" placeholder="Enter your email" autoComplete="email" className="mt-1.5 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-input focus-visible:outline-none" {...forgotForm.register('email')} />
                {forgotForm.formState.errors.email && <p className="mt-1 text-xs text-destructive">{forgotForm.formState.errors.email.message}</p>}
              </div>
              <Button type="submit" disabled={loading} className="mt-6 h-11 w-full">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Sending OTP...</> : 'Send OTP'}
              </Button>
              <button type="button" onClick={() => setView('login')} className="mt-4 text-center text-sm text-primary hover:underline">Back to Login</button>
            </form>
          )}

          {view === 'verifyReset' && (
            <div className="flex flex-col">
              <h2 className="text-center text-xl font-semibold tracking-tight">Verify your email</h2>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                We&apos;ve sent a verification code to:<br /><span className="font-medium text-foreground">{resetEmail}</span>
              </p>
              <p className="mt-4 text-center text-sm font-medium">Enter the 6-digit OTP</p>
              <OtpInput ref={resetOtpRef} value={resetOtp} onChange={setResetOtp} autoFocus />
              <Button onClick={handleVerifyReset} disabled={loading || resetOtp.length !== 6} className="mt-6 h-11 w-full">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Verifying...</> : 'Verify OTP'}
              </Button>
              <div className="mt-4 text-center">
                <button type="button" onClick={handleResendReset} disabled={resendCountdown > 0 || loading} className="text-sm font-medium text-primary hover:underline disabled:opacity-50">
                  {resendCountdown > 0 ? `Resend OTP in ${resendCountdown}s` : 'Resend OTP'}
                </button>
              </div>
              <button type="button" onClick={() => setView('forgot')} className="mt-2 text-center text-sm text-muted-foreground hover:text-foreground">Back</button>
            </div>
          )}

          {view === 'resetPassword' && (
            <form onSubmit={resetForm.handleSubmit((v) => handleResetPassword(v))} noValidate className="flex flex-col">
              <h2 className="text-center text-xl font-semibold tracking-tight">Reset password</h2>
              <div className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="reset-new">New password</Label>
                  <div className="relative mt-1.5">
                    <Input id="reset-new" type={showResetPassword ? 'text' : 'password'} placeholder="Enter new password" autoComplete="new-password" className="pr-10 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-input focus-visible:outline-none" {...resetForm.register('newPassword')} />
                    <button type="button" onClick={() => setShowResetPassword((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showResetPassword ? 'Hide password' : 'Show password'}>
                      {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {resetForm.formState.errors.newPassword && <p className="mt-1 text-xs text-destructive">{resetForm.formState.errors.newPassword.message}</p>}
                </div>
                <div>
                  <Label htmlFor="reset-confirm">Confirm password</Label>
                  <div className="relative mt-1.5">
                    <Input id="reset-confirm" type={showResetConfirm ? 'text' : 'password'} placeholder="Enter password again" autoComplete="new-password" className="pr-10 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-input focus-visible:outline-none" {...resetForm.register('confirmPassword')} />
                    <button type="button" onClick={() => setShowResetConfirm((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showResetConfirm ? 'Hide password' : 'Show password'}>
                      {showResetConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {resetForm.formState.errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{resetForm.formState.errors.confirmPassword.message}</p>}
                </div>
              </div>
              <Button type="submit" disabled={loading} className="mt-6 h-11 w-full">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Resetting password...</> : 'Reset Password'}
              </Button>
            </form>
          )}

          {view === 'success' && (
            <div className="flex flex-col items-center py-4 text-center">
              <h2 className="text-xl font-semibold tracking-tight">{successMessage || 'Success!'}</h2>
              <p className="mt-2 text-sm text-muted-foreground">You can now log in with your credentials.</p>
              <Button onClick={() => setView('login')} className="mt-6 h-11 w-full">Login</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
