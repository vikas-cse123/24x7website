import httpClient from './http.js'

// Public destination queries.
export const destinationApi = {
  list(params, { signal } = {}) {
    return httpClient.get('/destinations', { params, signal })
  },
  getBySlug(slug, { signal } = {}) {
    return httpClient.get(`/destinations/${slug}`, { signal })
  },
}

// Admin destination queries/mutations. Backend requires admin role.
export const adminDestinationApi = {
  list(params) {
    return httpClient.get('/admin/destinations', { params })
  },
  getById(id) {
    return httpClient.get(`/admin/destinations/${id}`)
  },
  create(data) {
    return httpClient.post('/admin/destinations', data)
  },
  update(id, data) {
    return httpClient.patch(`/admin/destinations/${id}`, data)
  },
  remove(id) {
    return httpClient.delete(`/admin/destinations/${id}`)
  },
  publish(id) {
    return httpClient.patch(`/admin/destinations/${id}/publish`)
  },
  unpublish(id) {
    return httpClient.patch(`/admin/destinations/${id}/unpublish`)
  },
}