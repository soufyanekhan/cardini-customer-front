<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import FormField from '@/components/FormField.vue'
import { parseApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const person = auth.person
const form = reactive({
  name: person.name,
  email: person.email ?? '',
  phone: person.phone ?? '',
  id_card_number: person.id_card_number ?? '',
})
const loading = ref(false)
const message = ref('')
const saved = ref(false)
const fields = ref({})

async function save() {
  loading.value = true
  message.value = ''
  saved.value = false
  fields.value = {}
  try {
    await auth.updateProfile({
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      id_card_number: form.id_card_number.trim() || null,
    })
    saved.value = true
  } catch (e) {
    const err = parseApiError(e)
    message.value = err.message
    fields.value = err.fields
  } finally {
    loading.value = false
  }
}

async function logout() {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="page">
    <header class="page__header">
      <p class="brand">Cardini <span>RDV</span></p>
      <button class="btn btn--ghost" type="button" @click="logout">Se déconnecter</button>
    </header>

    <main class="page__main">
      <h1 class="page__title">Bonjour, {{ auth.person?.name }}</h1>
      <p class="page__lead">
        Gardez vos coordonnées à jour pour que nous puissions vous joindre à propos de vos
        rendez-vous.
      </p>

      <form class="form form--wide" novalidate @submit.prevent="save">
        <p v-if="message" class="alert" role="alert">{{ message }}</p>
        <p v-if="saved" class="alert alert--ok" role="status">Modifications enregistrées.</p>

        <FormField
          :model-value="person.nin"
          label="Numéro national (NIN)"
          readonly
          hint="Ce numéro ne peut pas être modifié."
        />
        <FormField
          v-model="form.name"
          label="Nom complet"
          autocomplete="name"
          :errors="fields.name"
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

        <button class="btn btn--primary" type="submit" :disabled="loading">
          {{ loading ? 'Enregistrement…' : 'Enregistrer les modifications' }}
        </button>
      </form>
    </main>
  </div>
</template>
