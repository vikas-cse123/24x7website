import httpClient from './http.js'

// Customer booking APIs. All require the existing JWT auth cookie; the server
// scopes every response to the authenticated user.
export const bookingApi = {
  create(data) {
    return httpClient.post('/bookings', data)
  },
  list(params, { signal } = {}) {
    return httpClient.get('/bookings', { params, signal })
  },
  getById(id, { signal } = {}) {
    return httpClient.get(`/bookings/${id}`, { signal })
  },
  getByCode(code, { signal } = {}) {
    return httpClient.get(`/bookings/code/${code}`, { signal })
  },
  cancel(id) {
    return httpClient.post(`/bookings/${id}/cancel`)
  },
}

// Admin booking APIs (backend enforces admin role).
export const adminBookingApi = {
  list(params) {
    return httpClient.get('/admin/bookings', { params })
  },
  getById(id) {
    return httpClient.get(`/admin/bookings/${id}`)
  },
  setStatus(id, status) {
    return httpClient.patch(`/admin/bookings/${id}/status`, { status })
  },
  cancel(id) {
    return httpClient.patch(`/admin/bookings/${id}/cancel`)
  },
}
