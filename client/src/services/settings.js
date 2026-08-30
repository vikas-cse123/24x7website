import httpClient from './http.js'

// Public settings — read by the whole website, never requires authentication.
export const brandingApi = {
  get() {
    return httpClient.get('/settings/branding')
  },
}

export const publicSettingsApi = {
  get() {
    return httpClient.get('/settings')
  },
}

// Admin settings management (backend enforces admin role via RBAC).
export const adminBrandingApi = {
  get() {
    return httpClient.get('/admin/settings/branding')
  },
  uploadLogo(formData) {
    return httpClient.post('/admin/settings/branding/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  reset() {
    return httpClient.delete('/admin/settings/branding/logo')
  },
}

export const adminSettingsApi = {
  getAll() {
    return httpClient.get('/admin/settings')
  },
  updateContact(data) {
    return httpClient.patch('/admin/settings/contact', data)
  },
  updatePromotionalBanner(data) {
    return httpClient.patch('/admin/settings/promotional-banner', data)
  },
  getWhatsapp() {
    return httpClient.get('/admin/settings/whatsapp')
  },
  updateWhatsapp(data) {
    return httpClient.patch('/admin/settings/whatsapp', data)
  },
  uploadWhatsappIcon(formData) {
    return httpClient.post('/admin/settings/whatsapp/icon', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  clearWhatsappIcon() {
    return httpClient.delete('/admin/settings/whatsapp/icon')
  },
}

export const publicWhatsappApi = {
  get() {
    return httpClient.get('/settings/whatsapp')
  },
}