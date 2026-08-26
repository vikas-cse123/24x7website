import httpClient from './http.js'

export const authApi = {
  sendOtp({ countryCode, mobile }) {
    return httpClient.post('/auth/send-otp', { countryCode, mobile })
  },
  verifyOtp({ countryCode, mobile, otp }) {
    return httpClient.post('/auth/verify-otp', { countryCode, mobile, otp })
  },
  me() {
    return httpClient.get('/auth/me')
  },
  logout() {
    return httpClient.post('/auth/logout')
  },
}
