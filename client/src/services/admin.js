import httpClient from './http.js'

// Admin API. All endpoints are protected server-side (requireAuth +
// requireRole('admin')); the 401/403 responses are handled centrally.
export const adminApi = {
  dashboard() {
    return httpClient.get('/admin/dashboard')
  },
}