import httpClient from './http.js'

// Public reviews for a trip (approved only) + rating summary.
export const reviewApi = {
  listByTrip(slugOrId, params, { signal } = {}) {
    return httpClient.get(`/reviews/trips/${slugOrId}/reviews`, { params, signal })
  },
  eligibility(slugOrId, { signal } = {}) {
    return httpClient.get(`/reviews/trips/${slugOrId}/reviews/eligibility`, { signal })
  },
  create(data) {
    return httpClient.post('/reviews', data)
  },
  myReviews(params, { signal } = {}) {
    return httpClient.get('/reviews/me', { params, signal })
  },
}

// Admin moderation (backend enforces admin role).
export const adminReviewApi = {
  list(params) {
    return httpClient.get('/admin/reviews', { params })
  },
  setStatus(id, status, note) {
    return httpClient.patch(`/admin/reviews/${id}/status`, { status, note })
  },
  remove(id) {
    return httpClient.delete(`/admin/reviews/${id}`)
  },
}
