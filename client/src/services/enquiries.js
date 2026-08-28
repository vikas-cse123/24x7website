import httpClient from './http.js'

// Public lead submission (works for logged-out visitors).
export const enquiryApi = {
  create(data) {
    return httpClient.post('/enquiries', data)
  },
}

// Admin enquiry management. Backend requires the admin role.
export const adminEnquiryApi = {
  list(params) {
    return httpClient.get('/admin/enquiries', { params })
  },
  getById(id) {
    return httpClient.get(`/admin/enquiries/${id}`)
  },
  setStatus(id, status) {
    return httpClient.patch(`/admin/enquiries/${id}/status`, { status })
  },
  remove(id) {
    return httpClient.delete(`/admin/enquiries/${id}`)
  },
}