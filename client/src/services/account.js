import httpClient from './http.js'
export const accountApi = {
  getProfile(){ return httpClient.get('/account/profile') },
  updateProfile(data){ return httpClient.patch('/account/profile', data) },
  listBookings(params){ return httpClient.get('/account/bookings', { params }) },
  getBookingByCode(code){ return httpClient.get(`/account/bookings/${code}`) },
  listTravellers(){ return httpClient.get('/account/travellers') },
  createTraveller(data){ return httpClient.post('/account/travellers', data) },
  updateTraveller(id, data){ return httpClient.patch(`/account/travellers/${id}`, data) },
  deleteTraveller(id){ return httpClient.delete(`/account/travellers/${id}`) },
}
export const wishlistApi = {
  list(){ return httpClient.get('/account/wishlist') },
  create(type,id){ return httpClient.post('/account/wishlist', {type,id}) },
  remove(type,id){ return httpClient.delete(`/account/wishlist/${type}/${id}`)},
}

export const notificationApi = {
  list(params){ return httpClient.get('/account/notifications', { params }) },
  unreadCount(){ return httpClient.get('/account/notifications/unread-count') },
  markRead(id){ return httpClient.patch(`/account/notifications/${id}/read`) },
  markAllRead(){ return httpClient.patch('/account/notifications/read-all') },
  remove(id){ return httpClient.delete(`/account/notifications/${id}`) },
}
