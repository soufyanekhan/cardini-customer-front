<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const identifier = ref('')
const password = ref('')
const error = ref('')
const auth = useAuthStore()
const router = useRouter()

async function handleLogin() {
  error.value = ''
  try {
    await auth.login(identifier.value, password.value)
    router.push('/dashboard')
  } catch (e) {
    error.value = 'Invalid credentials.'
  }
}
</script>

<template>
  <form @submit.prevent="handleLogin">
    <h1>Cardini — My Account</h1>
    <input v-model="identifier" placeholder="NIN, ID card number, or identifier" required />
    <input v-model="password" type="password" placeholder="Password" required />
    <button type="submit">Log in</button>
    <p v-if="error">{{ error }}</p>
  </form>
</template>
