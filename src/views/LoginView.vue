<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AuthShell from '@/components/AuthShell.vue'
import FormField from '@/components/FormField.vue'
import { parseApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = reactive({ login: '', password: '' })
const loading = ref(false)
const message = ref(
  route.query.expired ? 'Votre session a expiré. Reconnectez-vous pour continuer.' : '',
)
const fields = ref({})

async function submit() {
  loading.value = true
  message.value = ''
  fields.value = {}
  try {
    await auth.login({ login: form.login.trim(), password: form.password })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/profil'
    await router.push(redirect)
  } catch (e) {
    const err = parseApiError(e)
    message.value = err.message
    fields.value = err.fields
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthShell title="Connexion" subtitle="Accédez à votre compte pour gérer vos rendez-vous.">
    <form class="form" novalidate @submit.prevent="submit">
      <p v-if="message" class="alert" role="alert">{{ message }}</p>

      <FormField
        v-model="form.login"
        label="Numéro national (NIN) ou e-mail"
        autocomplete="username"
        :errors="fields.login"
      />
      <FormField
        v-model="form.password"
        label="Mot de passe"
        type="password"
        autocomplete="current-password"
        :errors="fields.password"
      />

      <button class="btn btn--primary" type="submit" :disabled="loading">
        {{ loading ? 'Connexion en cours…' : 'Se connecter' }}
      </button>
    </form>

    <template #footer>
      Pas encore de compte ? <RouterLink :to="{ name: 'register' }">Créer un compte</RouterLink>
    </template>
  </AuthShell>
</template>
