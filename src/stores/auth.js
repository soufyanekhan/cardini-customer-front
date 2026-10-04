import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api, TOKEN_KEY } from '@/lib/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY))
  /** Person: { id, nin, id_card_number, email, name, phone, created_at, updated_at } */
  const person = ref(null)

  const isAuthenticated = computed(() => token.value !== null)

  function setSession(data) {
    token.value = data.token
    person.value = data.person
    localStorage.setItem(TOKEN_KEY, data.token)
  }

  function clearSession() {
    token.value = null
    person.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  /** @param {{ login: string, password: string }} payload NIN or email + password */
  async function login(payload) {
    const { data } = await api.post('/customer/login', payload)
    setSession(data)
  }

  /** @param {{ name, nin, email?, phone?, id_card_number?, password, password_confirmation }} payload */
  async function register(payload) {
    const { data } = await api.post('/customer/register', payload)
    setSession(data)
  }

  async function fetchMe() {
    const { data } = await api.get('/customer/me')
    person.value = data.person
  }

  /** @param {{ name, email, phone, id_card_number }} payload */
  async function updateProfile(payload) {
    const { data } = await api.put('/customer/me', payload)
    person.value = data.person
  }

  async function logout() {
    try {
      await api.post('/customer/logout')
    } finally {
      clearSession()
    }
  }

  return {
    token,
    person,
    isAuthenticated,
    login,
    register,
    fetchMe,
    updateProfile,
    logout,
    clearSession,
  }
})
