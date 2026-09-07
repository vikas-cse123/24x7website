import httpClient from './http.js'

export const authApi = {
  // Legacy phone OTP (kept for backward compat)
  sendOtp({ countryCode, mobile }) {
    return httpClient.post('/auth/send-otp', { countryCode, mobile })
  },
  verifyOtp({ countryCode, mobile, otp }) {
    return httpClient.post('/auth/verify-otp', { countryCode, mobile, otp })
  },
  signup({ name, email, phone, countryCode, password }) {
    return httpClient.post('/auth/signup', { name, email, phone, countryCode, password })
  },
  verifyEmail({ email, otp }) {
    return httpClient.post('/auth/verify-email', { email, otp })
  },
  resendVerification({ email }) {
    return httpClient.post('/auth/resend-verification', { email })
  },
  login({ email, password }) {
    return httpClient.post('/auth/login', { email, password })
  },
  forgotPassword({ email }) {
    return httpClient.post('/auth/forgot-password', { email })
  },
  verifyResetOtp({ email, otp }) {
    return httpClient.post('/auth/verify-reset-otp', { email, otp })
  },
  resetPassword({ email, newPassword, confirmPassword }) {
    return httpClient.post('/auth/reset-password', { email, newPassword, confirmPassword })
  },
  resendPasswordReset({ email }) {
    return httpClient.post('/auth/resend-password-reset', { email })
  },
  me() {
    return httpClient.get('/auth/me')
  },
  logout() {
    return httpClient.post('/auth/logout')
  },
}
