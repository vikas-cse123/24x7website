import httpClient from './http.js'

// Public FAQs. All endpoints return only published FAQs.
export const faqApi = {
  list(params, { signal } = {}) {
    return httpClient.get('/faqs', { params, signal })
  },
  listForDestination(slug, params, { signal } = {}) {
    return httpClient.get(`/destinations/${slug}/faqs`, { params, signal })
  },
  listForTrip(slug, params, { signal } = {}) {
    return httpClient.get(`/trips/${slug}/faqs`, { params, signal })
  },
}

// Admin FAQ management (backend enforces admin role).
export const adminFaqApi = {
  list(params) {
    return httpClient.get('/admin/faqs', { params })
  },
  getById(id) {
    return httpClient.get(`/admin/faqs/${id}`)
  },
  create(data) {
    return httpClient.post('/admin/faqs', data)
  },
  update(id, data) {
    return httpClient.patch(`/admin/faqs/${id}`, data)
  },
  remove(id) {
    return httpClient.delete(`/admin/faqs/${id}`)
  },
  publish(id) {
    return httpClient.patch(`/admin/faqs/${id}/publish`)
  },
  unpublish(id) {
    return httpClient.patch(`/admin/faqs/${id}/unpublish`)
  },
  reorder(items) {
    return httpClient.post('/admin/faqs/reorder', { items })
  },
}
