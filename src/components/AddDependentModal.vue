<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import FormField from '@/components/FormField.vue'
import { api, parseApiError } from '@/lib/api'

const props = defineProps({
  /** Shops where the connected customer holds a group: [{ group_id, shop_name }] */
  shops: { type: Array, required: true },
})
const emit = defineEmits(['close', 'success'])

// ---------- Step 1: person ----------
const mode = ref('found') // 'found' | 'new' | 'placeholder'
const nin = ref('')
const found = ref(null)
const searching = ref(false)
const lookupMessage = ref('')
const form = reactive({ name: '', nin: '', id_card_number: '', email: '', phone: '' })
const placeholderName = ref('')

async function lookup() {
  lookupMessage.value = ''
  searching.value = true
  try {
    const { data } = await api.get('/customer/persons/lookup', {
      params: { nin: nin.value.trim() },
    })
    found.value = data.person
  } catch (e) {
    lookupMessage.value = parseApiError(e).message
  } finally {
    searching.value = false
  }
}

function startNew() {
  form.nin = nin.value.trim()
  mode.value = 'new'
}

function backToSearch() {
  mode.value = 'found'
  found.value = null
  lookupMessage.value = ''
}

// ---------- Step 2: shops ----------
const single = props.shops.length === 1
const scope = ref(single ? 'selected' : 'all') // 'all' | 'selected'
const picked = ref(single ? [props.shops[0].group_id] : [])

// ---------- submit ----------
const submitting = ref(false)
const error = ref('')
const fields = ref({})

async function submit() {
  error.value = ''
  fields.value = {}

  if (mode.value === 'found' && !found.value)
    return (error.value = 'Recherchez et sélectionnez une personne.')
  if (mode.value === 'new' && (!form.name.trim() || !form.nin.trim())) {
    return (error.value = 'Le nom et le NIN sont obligatoires.')
  }
  if (mode.value === 'placeholder' && !placeholderName.value.trim())
    return (error.value = 'Le nom affiché est obligatoire.')
  if (scope.value === 'selected' && !picked.value.length)
    return (error.value = 'Choisissez au moins une boutique.')

  submitting.value = true
  try {
    const payload = {
      mode: mode.value,
      scope: scope.value,
      group_ids: scope.value === 'selected' ? picked.value : undefined,
      person_id: mode.value === 'found' ? found.value.id : undefined,
      ...(mode.value === 'new' && {
        name: form.name.trim(),
        nin: form.nin.trim(),
        id_card_number: form.id_card_number.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
      }),
      placeholder_name: mode.value === 'placeholder' ? placeholderName.value.trim() : undefined,
    }
    const { data } = await api.post('/customer/dependents', payload)
    emit('success', data.message)
  } catch (e) {
    const err = parseApiError(e)
    fields.value = err.fields
    error.value = Object.values(err.fields)[0]?.[0] ?? err.message
  } finally {
    submitting.value = false
  }
}

const closeBtn = ref(null)
const canSubmit = computed(() => !submitting.value)
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
      aria-labelledby="add-dep-title"
    >
      <div class="modal-header">
        <h2 id="add-dep-title" class="modal-title">Ajouter une personne à charge</h2>
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
        <!-- Step 1 -->
        <p class="step-label">Étape 1 — La personne</p>

        <template v-if="mode === 'found'">
          <div v-if="found" class="picked-card">
            <div>
              <p class="row__title">{{ found.name }}</p>
              <p class="row__meta">NIN {{ found.nin }}</p>
            </div>
            <button class="link-btn" type="button" @click="backToSearch">Changer</button>
          </div>

          <template v-else>
            <form class="inline-form inline-form--tight" novalidate @submit.prevent="lookup">
              <FormField
                v-model="nin"
                label="NIN de la personne"
                inputmode="numeric"
                hint="La personne doit déjà avoir un compte."
              />
              <button class="btn btn--primary" type="submit" :disabled="searching || !nin.trim()">
                {{ searching ? 'Recherche…' : 'Rechercher' }}
              </button>
            </form>
            <p v-if="lookupMessage" class="alert" role="status">{{ lookupMessage }}</p>
            <div class="link-row">
              <button class="link-btn" type="button" @click="mode = 'placeholder'">
                Personne sans détails
              </button>
            </div>
          </template>
        </template>

        <template v-else-if="mode === 'new'">
          <FormField v-model="form.name" label="Nom complet" :errors="fields.name" />
          <FormField v-model="form.nin" label="NIN" inputmode="numeric" :errors="fields.nin" />
          <FormField
            v-model="form.id_card_number"
            label="Carte d'identité"
            optional
            :errors="fields.id_card_number"
          />
          <div class="form__row">
            <FormField
              v-model="form.email"
              label="E-mail"
              type="email"
              optional
              :errors="fields.email"
            />
            <FormField
              v-model="form.phone"
              label="Téléphone"
              type="tel"
              optional
              :errors="fields.phone"
            />
          </div>
          <button class="link-btn" type="button" @click="backToSearch">
            ← Retour à la recherche
          </button>
        </template>

        <template v-else>
          <FormField
            v-model="placeholderName"
            label="Nom affiché"
            hint="Ex. : Fils, Voisin. Un identifiant provisoire sera créé."
            :errors="fields.placeholder_name"
          />
          <button class="link-btn" type="button" @click="backToSearch">
            ← Retour à la recherche
          </button>
        </template>

        <!-- Step 2 -->
        <p class="step-label">Étape 2 — Boutiques</p>

        <div v-if="!single" class="seg" role="group" aria-label="Boutiques concernées">
          <button
            type="button"
            class="seg__btn"
            :aria-pressed="scope === 'all'"
            @click="scope = 'all'"
          >
            Toutes mes boutiques ({{ shops.length }})
          </button>
          <button
            type="button"
            class="seg__btn"
            :aria-pressed="scope === 'selected'"
            @click="scope = 'selected'"
          >
            Choisir des boutiques
          </button>
        </div>

        <ul v-if="scope === 'selected'" class="checks">
          <li v-for="s in shops" :key="s.group_id">
            <label class="check">
              <input v-model="picked" type="checkbox" :value="s.group_id" />
              <span>{{ s.shop_name }}</span>
            </label>
          </li>
        </ul>
        <p v-else class="row__meta">
          La personne sera ajoutée à votre groupe dans chacune de vos boutiques.
        </p>

        <p v-if="error" class="alert" role="alert">{{ error }}</p>
      </div>

      <div class="modal-footer">
        <button class="btn btn--ghost" type="button" @click="emit('close')">Annuler</button>
        <button
          class="btn btn--primary btn--inline"
          type="button"
          :disabled="!canSubmit"
          @click="submit"
        >
          {{ submitting ? 'Ajout…' : 'Ajouter' }}
        </button>
      </div>
    </div>
  </div>
</template>
