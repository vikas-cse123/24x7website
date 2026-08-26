import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || '/api'

const httpClient = axios.create({
  baseURL,
  withCredentials: true,
})

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong'
    return Promise.reject({ ...error, message })
  },
)

export default httpClient
