import httpClient from './http.js'

// Public travel blogs.
export const blogApi = {
  list(params) {
    return httpClient.get('/blogs', { params })
  },
  listByDestination(destinationSlug, params) {
    return httpClient.get(`/blogs/destination/${destinationSlug}`, { params })
  },
  getBySlug(slug) {
    return httpClient.get(`/blogs/${slug}`)
  },
}

// Admin blog management (backend enforces admin role).
export const adminBlogApi = {
  list(params) {
    return httpClient.get('/admin/blogs', { params })
  },
  getById(id) {
    return httpClient.get(`/admin/blogs/${id}`)
  },
  create(data) {
    return httpClient.post('/admin/blogs', data)
  },
  update(id, data) {
    return httpClient.patch(`/admin/blogs/${id}`, data)
  },
  publish(id) {
    return httpClient.patch(`/admin/blogs/${id}/publish`)
  },
  unpublish(id) {
    return httpClient.patch(`/admin/blogs/${id}/unpublish`)
  },
  remove(id) {
    return httpClient.delete(`/admin/blogs/${id}`)
  },
}
