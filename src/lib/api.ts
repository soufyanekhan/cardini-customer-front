import axios from 'axios'

export const TOKEN_KEY = 'cardini_customer_token'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ignore 401 on the login call itself (wrong credentials is not an expired session).
    const isLogin = error?.config?.url?.includes('/customer/login')
    if (axios.isAxiosError(error) && error.response?.status === 401 && !isLogin) {
      localStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new Event('auth:expired'))
    }
    return Promise.reject(error)
  },
)

export type FieldErrors = Record<string, string[]>

/** Turns an Axios/Laravel error into a message and per-field errors (HTTP 422). */
export function parseApiError(error: unknown): { message: string; fields: FieldErrors } {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return {
        message: 'Le serveur est injoignable. Vérifiez votre connexion et réessayez.',
        fields: {},
      }
    }
    const data = error.response.data as { message?: string; errors?: FieldErrors } | undefined
    return {
      message: data?.message ?? 'Une erreur est survenue. Réessayez dans un instant.',
      fields: data?.errors ?? {},
    }
  }
  return { message: 'Une erreur inattendue est survenue.', fields: {} }
}
