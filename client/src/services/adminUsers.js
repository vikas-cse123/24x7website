import httpClient from './http.js'

export const adminUsersApi = {
  list(params) {
    return httpClient.get('/admin/users', { params })
  },
  getById(id) {
    return httpClient.get(`/admin/users/${id}`)
  },
  wishlist(id) {
    return httpClient.get(`/admin/users/${id}/wishlist`)
  },
}
