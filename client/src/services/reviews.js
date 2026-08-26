import httpClient from './http.js'

// Public reviews for a trip (approved only) + rating summary.
export const reviewApi = {
  listByTrip(slugOrId, params) {
    return httpClient.get(`/reviews/trips/${slugOrId}/reviews`, { params })
  },
  eligibility(slugOrId) {
    return httpClient.get(`/reviews/trips/${slugOrId}/reviews/eligibility`)
  },
  create(data) {
    return httpClient.post('/reviews', data)
  },
  myReviews(params) {
    return httpClient.get('/reviews/me', { params })
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
