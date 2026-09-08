import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || '/api'

const httpClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
})

function isCancelledError(error) {
  return (
    error?.code === 'ERR_CANCELED' ||
    error?.name === 'CanceledError' ||
    error?.message === 'canceled'
  )
}

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isCancelledError(error)) {
      // Normal cancellation (navigation abort / timeout) — do not surface as user error
      return Promise.reject(error)
    }
    const message = error.response?.data?.message || error.message || 'Something went wrong'
    return Promise.reject({ ...error, message })
  },
)

export default httpClient
