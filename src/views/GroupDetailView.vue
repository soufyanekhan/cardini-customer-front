<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import FormField from '@/components/FormField.vue'
import { parseApiError } from '@/lib/api'
import { useGroupsStore } from '@/stores/groups'

const store = useGroupsStore()
const route = useRoute()
const router = useRouter()
const groupId = route.params.id

const group = ref(null)
const loading = ref(true)
const message = ref('')
const saved = ref(false)

const name = ref('')
const renaming = ref(false)
const renameErrors = ref({})

const nin = ref('')
const adding = ref(false)
const addErrors = ref({})

onMounted(async () => {
  try {
    group.value = await store.fetchGroup(groupId)
    name.value = group.value.name
  } catch (e) {
    message.value = parseApiError(e).message
  } finally {
    loading.value = false
  }
})

async function rename() {
  renaming.value = true
  message.value = ''
  saved.value = false
  renameErrors.value = {}
  try {
    group.value = await store.renameGroup(groupId, name.value.trim())
    name.value = group.value.name
    saved.value = true
  } catch (e) {
    const err = parseApiError(e)
    renameErrors.value = err.fields
    if (!Object.keys(err.fields).length) message.value = err.message
  } finally {
    renaming.value = false
  }
}

async function addMember() {
  adding.value = true
  message.value = ''
  addErrors.value = {}
  try {
    group.value = await store.addMember(groupId, nin.value.trim())
    nin.value = ''
  } catch (e) {
    const err = parseApiError(e)
    addErrors.value = err.fields
    if (!Object.keys(err.fields).length) message.value = err.message
  } finally {
    adding.value = false
  }
}

async function removeMember(member) {
  if (!window.confirm(`Retirer ${member.name} du groupe ?`)) return
  message.value = ''
  try {
    group.value = await store.removeMember(groupId, member.id)
  } catch (e) {
    message.value = parseApiError(e).message
  }
}

async function removeGroup() {
  if (!window.confirm(`Supprimer le groupe « ${group.value.name} » ? Cette action est définitive.`))
    return
  try {
    await store.deleteGroup(group.value.id)
    await router.push({ name: 'groups' })
  } catch (e) {
    message.value = parseApiError(e).message
  }
}
</script>

<template>
  <AppLayout>
    <RouterLink :to="{ name: 'groups' }" class="back">← Tous les groupes</RouterLink>

    <p v-if="loading" class="muted">Chargement…</p>
    <p v-else-if="!group" class="alert" role="alert">{{ message || 'Groupe introuvable.' }}</p>

    <template v-else>
      <h1 class="page__title">{{ group.name }}</h1>
      <p class="page__lead">
        {{ group.members?.length ?? 0 }} membre{{ (group.members?.length ?? 0) > 1 ? 's' : '' }}
      </p>

      <p v-if="message" class="alert" role="alert">{{ message }}</p>
      <p v-if="saved" class="alert alert--ok" role="status">Nom du groupe mis à jour.</p>

      <section class="section section--first">
        <h2 class="section-title">Nom du groupe</h2>
        <form class="inline-form" novalidate @submit.prevent="rename">
          <FormField v-model="name" label="Nom" :errors="renameErrors.name" />
          <button class="btn btn--primary" type="submit" :disabled="renaming || !name.trim()">
            {{ renaming ? 'Enregistrement…' : 'Renommer' }}
          </button>
        </form>
      </section>

      <section class="section">
        <h2 class="section-title">Membres</h2>

        <form class="inline-form" novalidate @submit.prevent="addMember">
          <FormField
            v-model="nin"
            label="NIN de la personne à ajouter"
            inputmode="numeric"
            hint="La personne doit déjà avoir un compte Cardini RDV."
            :errors="addErrors.nin"
          />
          <button class="btn btn--primary" type="submit" :disabled="adding || !nin.trim()">
            {{ adding ? 'Ajout…' : 'Ajouter' }}
          </button>
        </form>

        <div v-if="!group.members?.length" class="empty empty--spaced">
          <p>Ce groupe n'a pas encore de membre.</p>
        </div>

        <ul v-else class="list list--spaced">
          <li v-for="m in group.members" :key="m.id" class="row">
            <div>
              <p class="row__title">{{ m.name }}</p>
              <p class="row__meta">
                NIN {{ m.nin }}<template v-if="m.phone"> · {{ m.phone }}</template>
              </p>
            </div>
            <button class="btn btn--danger btn--small" type="button" @click="removeMember(m)">
              Retirer
            </button>
          </li>
        </ul>
      </section>

      <section class="section">
        <h2 class="section-title">Zone sensible</h2>
        <button class="btn btn--danger" type="button" @click="removeGroup">
          Supprimer ce groupe
        </button>
      </section>
    </template>
  </AppLayout>
</template>
