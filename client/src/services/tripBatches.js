import httpClient from './http.js'

// Public upcoming departures for a trip (published, open/full, future only —
// enforced server-side).
export const tripBatchApi = {
  listByTrip(tripId) {
    return httpClient.get(`/trips/${tripId}/batches`)
  },
}

// Admin trip-batch queries/mutations. Backend requires admin role.
export const adminTripBatchApi = {
  list(params) {
    return httpClient.get('/admin/trip-batches', { params })
  },
  getById(id) {
    return httpClient.get(`/admin/trip-batches/${id}`)
  },
  create(data) {
    return httpClient.post('/admin/trip-batches', data)
  },
  update(id, data) {
    return httpClient.patch(`/admin/trip-batches/${id}`, data)
  },
  remove(id) {
    return httpClient.delete(`/admin/trip-batches/${id}`)
  },
  publish(id) {
    return httpClient.patch(`/admin/trip-batches/${id}/publish`)
  },
  unpublish(id) {
    return httpClient.patch(`/admin/trip-batches/${id}/unpublish`)
  },
  setStatus(id, status) {
    return httpClient.patch(`/admin/trip-batches/${id}/status`, { status })
  },
}
