<script setup>
import { onMounted, ref } from 'vue'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const me = ref(null)

onMounted(async () => {
  const { data } = await api.get('/customer/me') // or /admin/me in admin front
  me.value = data
})
</script>

<template>
  <div>
    <h1>Welcome, {{ me?.name }}</h1>
    <button @click="auth.logout()">Log out</button>
  </div>
</template>
