<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AuthShell from '@/components/AuthShell.vue'
import FormField from '@/components/FormField.vue'
import { parseApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({
  name: '',
  nin: '',
  email: '',
  phone: '',
  id_card_number: '',
  password: '',
  password_confirmation: '',
})
const loading = ref(false)
const message = ref('')
const fields = ref({})

async function submit() {
  loading.value = true
  message.value = ''
  fields.value = {}

  if (form.password !== form.password_confirmation) {
    fields.value = { password_confirmation: ['Les deux mots de passe doivent être identiques.'] }
    loading.value = false
    return
  }

  try {
    // Optional fields are only sent when filled in, so the API stores NULL (unique columns).
    await auth.register({
      name: form.name.trim(),
      nin: form.nin.trim(),
      password: form.password,
      password_confirmation: form.password_confirmation,
      ...(form.email.trim() && { email: form.email.trim() }),
      ...(form.phone.trim() && { phone: form.phone.trim() }),
      ...(form.id_card_number.trim() && { id_card_number: form.id_card_number.trim() }),
    })
    await router.push({ name: 'dashboard' })
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
  <AuthShell
    title="Créer un compte"
    subtitle="Quelques informations suffisent pour réserver votre premier rendez-vous."
  >
    <form class="form" novalidate @submit.prevent="submit">
      <p v-if="message" class="alert" role="alert">{{ message }}</p>

      <FormField
        v-model="form.name"
        label="Nom complet"
        autocomplete="name"
        :errors="fields.name"
      />
      <FormField
        v-model="form.nin"
        label="Numéro national (NIN)"
        inputmode="numeric"
        hint="Il vous identifie de façon unique et sert à vous connecter."
        :errors="fields.nin"
      />
      <div class="form__row">
        <FormField
          v-model="form.email"
          label="E-mail"
          type="email"
          autocomplete="email"
          optional
          :errors="fields.email"
        />
        <FormField
          v-model="form.phone"
          label="Téléphone"
          type="tel"
          autocomplete="tel"
          optional
          :errors="fields.phone"
        />
      </div>
      <FormField
        v-model="form.id_card_number"
        label="Numéro de carte d'identité"
        optional
        :errors="fields.id_card_number"
      />
      <div class="form__row">
        <FormField
          v-model="form.password"
          label="Mot de passe"
          type="password"
          autocomplete="new-password"
          hint="8 caractères minimum."
          :errors="fields.password"
        />
        <FormField
          v-model="form.password_confirmation"
          label="Confirmer le mot de passe"
          type="password"
          autocomplete="new-password"
          :errors="fields.password_confirmation"
        />
      </div>

      <button class="btn btn--primary" type="submit" :disabled="loading">
        {{ loading ? 'Création en cours…' : 'Créer mon compte' }}
      </button>
    </form>

    <template #footer>
      Vous avez déjà un compte ? <RouterLink :to="{ name: 'login' }">Se connecter</RouterLink>
    </template>
  </AuthShell>
</template>
