<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const form = ref({
  nin: '',
  id_card_number: '',
  identifier: '',
  name: '',
  phone: '',
  password: '',
  password_confirmation: '',
})
const error = ref('')
const auth = useAuthStore()
const router = useRouter()

async function handleRegister() {
  error.value = ''
  try {
    await auth.register(form.value)
    router.push('/login')
  } catch (e) {
    error.value = e.response?.data?.message || 'Registration failed.'
  }
}
</script>

<template>
  <form @submit.prevent="handleRegister">
    <h1>Create your Cardini account</h1>
    <input v-model="form.name" placeholder="Full name" required />
    <input v-model="form.nin" placeholder="NIN" required />
    <input v-model="form.id_card_number" placeholder="ID card number (optional)" />
    <input v-model="form.identifier" type="identifier" placeholder="identifier (optional)" />
    <input v-model="form.phone" placeholder="Phone" />
    <input v-model="form.password" type="password" placeholder="Password" required />
    <input
      v-model="form.password_confirmation"
      type="password"
      placeholder="Confirm password"
      required
    />
    <button type="submit">Register</button>
    <p v-if="error">{{ error }}</p>
  </form>
</template>
