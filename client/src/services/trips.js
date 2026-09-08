import httpClient from './http.js'

// Public trip queries.
export const tripApi = {
  list(params, { signal } = {}) {
    return httpClient.get('/trips', { params, signal })
  },
  getBySlug(slug, { signal } = {}) {
    return httpClient.get(`/trips/${slug}`, { signal })
  },
}

// Admin trip queries/mutations. Backend requires admin role.
export const adminTripApi = {
  list(params) {
    return httpClient.get('/admin/trips', { params })
  },
  getById(id) {
    return httpClient.get(`/admin/trips/${id}`)
  },
  create(data) {
    return httpClient.post('/admin/trips', data)
  },
  update(id, data) {
    return httpClient.patch(`/admin/trips/${id}`, data)
  },
  remove(id) {
    return httpClient.delete(`/admin/trips/${id}`)
  },
  publish(id) {
    return httpClient.patch(`/admin/trips/${id}/publish`)
  },
  unpublish(id) {
    return httpClient.patch(`/admin/trips/${id}/unpublish`)
  },
}