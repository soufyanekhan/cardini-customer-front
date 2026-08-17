import { defineStore } from 'pinia'
import api from '@/api/client'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    customer: JSON.parse(localStorage.getItem('customer')) || null,
    token: localStorage.getItem('token') || null,
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
  },
  actions: {
    async login(identifier, password) {
      const { data } = await api.post('/customer/login', { identifier, password })
      this.token = data.token
      this.customer = data.customer
      localStorage.setItem('token', data.token)
      localStorage.setItem('customer', JSON.stringify(data.customer))
    },
    async logout() {
      await api.post('/customer/logout')
      this.token = null
      this.customer = null
      localStorage.removeItem('token')
      localStorage.removeItem('customer')
    },
  },
})
