<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import FormField from '@/components/FormField.vue'
import { api, parseApiError } from '@/lib/api'

const props = defineProps({
  /** { person_id, name } of the unnamed dependent */
  person: { type: Object, required: true },
})
const emit = defineEmits(['close', 'success'])

const nin = ref('')
const step = ref('input') // 'input' | 'confirm'
const target = ref(null) // existing account with that NIN, or null
const loading = ref(false)
const error = ref('')
const fields = ref({})

async function check() {
  error.value = ''
  loading.value = true
  try {
    const { data } = await api.get('/customer/persons/lookup', {
      params: { nin: nin.value.trim() },
    })
    target.value = data.person
    step.value = 'confirm'
  } catch (e) {
    if (e.response?.status === 404) {
      target.value = null // no account: the NIN will simply be attached
      step.value = 'confirm'
    } else {
      error.value = parseApiError(e).message
    }
  } finally {
    loading.value = false
  }
}

async function confirm() {
  error.value = ''
  fields.value = {}
  loading.value = true
  try {
    const { data } = await api.post(`/customer/dependents/${props.person.person_id}/assign-nin`, {
      nin: nin.value.trim(),
    })
    emit('success', data.message)
  } catch (e) {
    const err = parseApiError(e)
    fields.value = err.fields
    error.value = Object.values(err.fields)[0]?.[0] ?? err.message
    step.value = 'input'
  } finally {
    loading.value = false
  }
}

const closeBtn = ref(null)
function onKey(e) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => {
  document.addEventListener('keydown', onKey)
  closeBtn.value?.focus()
})
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div
      class="modal-box modal-box--form"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-title"
    >
      <div class="modal-header">
        <h2 id="assign-title" class="modal-title">Associer un NIN</h2>
        <button
          ref="closeBtn"
          class="modal-close"
          type="button"
          aria-label="Fermer"
          @click="emit('close')"
        >
          ×
        </button>
      </div>

      <div class="modal-body modal-body--form">
        <p>
          Personne : <strong>{{ person.name }}</strong>
          <span class="row__meta"> (identifiant provisoire)</span>
        </p>

        <form
          v-if="step === 'input'"
          class="inline-form inline-form--tight"
          novalidate
          @submit.prevent="check"
        >
          <FormField v-model="nin" label="NIN réel" inputmode="numeric" :errors="fields.nin" />
          <button class="btn btn--primary" type="submit" :disabled="loading || !nin.trim()">
            {{ loading ? 'Vérification…' : 'Vérifier' }}
          </button>
        </form>

        <template v-else>
          <div v-if="target" class="picked-card picked-card--warn">
            <div>
              <p class="row__title">Un compte existe : {{ target.name }}</p>
              <p class="row__meta">NIN {{ nin.trim() }}</p>
            </div>
          </div>
          <p v-if="target">
            Les boutiques, groupes, achats et dettes de « {{ person.name }} » seront rattachés à ce
            compte, puis l'identifiant provisoire sera supprimé. Cette action est définitive.
          </p>
          <p v-else>
            Aucun compte ne porte ce NIN : il sera simplement associé à « {{ person.name }} ».
          </p>
        </template>

        <p v-if="error" class="alert" role="alert">{{ error }}</p>
      </div>

      <div class="modal-footer">
        <button
          class="btn btn--ghost"
          type="button"
          @click="step === 'confirm' ? (step = 'input') : emit('close')"
        >
          {{ step === 'confirm' ? 'Retour' : 'Annuler' }}
        </button>
        <button
          v-if="step === 'confirm'"
          class="btn btn--primary btn--inline"
          type="button"
          :disabled="loading"
          @click="confirm"
        >
          {{ loading ? 'Traitement…' : target ? 'Fusionner' : 'Associer' }}
        </button>
      </div>
    </div>
  </div>
</template>
