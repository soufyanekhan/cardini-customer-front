<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import FormField from '@/components/FormField.vue'
import { parseApiError } from '@/lib/api'
import { useGroupsStore } from '@/stores/groups'

const store = useGroupsStore()

const loading = ref(true)
const message = ref('')
const newName = ref('')
const creating = ref(false)
const createErrors = ref({})

onMounted(async () => {
  try {
    await store.fetchGroups()
  } catch (e) {
    message.value = parseApiError(e).message
  } finally {
    loading.value = false
  }
})

async function create() {
  creating.value = true
  message.value = ''
  createErrors.value = {}
  try {
    await store.createGroup(newName.value.trim())
    newName.value = ''
  } catch (e) {
    const err = parseApiError(e)
    createErrors.value = err.fields
    if (!Object.keys(err.fields).length) message.value = err.message
  } finally {
    creating.value = false
  }
}

async function remove(group) {
  if (!window.confirm(`Supprimer le groupe « ${group.name} » ? Cette action est définitive.`))
    return
  message.value = ''
  try {
    await store.deleteGroup(group.id)
  } catch (e) {
    message.value = parseApiError(e).message
  }
}
</script>

<template>
  <AppLayout>
    <h1 class="page__title">Mes groupes</h1>
    <p class="page__lead">
      Créez des groupes et ajoutez-y les personnes avec qui vous prenez rendez-vous.
    </p>

    <p v-if="message" class="alert" role="alert">{{ message }}</p>

    <form class="inline-form" novalidate @submit.prevent="create">
      <FormField v-model="newName" label="Nom du nouveau groupe" :errors="createErrors.name" />
      <button class="btn btn--primary" type="submit" :disabled="creating || !newName.trim()">
        {{ creating ? 'Création…' : 'Créer le groupe' }}
      </button>
    </form>

    <section class="section">
      <p v-if="loading" class="muted">Chargement…</p>

      <div v-else-if="!store.groups.length" class="empty">
        <p>Aucun groupe pour le moment. Créez le premier avec le formulaire ci-dessus.</p>
      </div>

      <ul v-else class="list">
        <li v-for="g in store.groups" :key="g.id" class="row">
          <div>
            <p class="row__title">{{ g.name }}</p>
            <p class="row__meta">
              {{ g.members_count }} membre{{ g.members_count > 1 ? 's' : '' }}
            </p>
          </div>
          <div class="row__actions">
            <RouterLink
              :to="{ name: 'group-detail', params: { id: g.id } }"
              class="btn btn--ghost btn--small"
            >
              Gérer
            </RouterLink>
            <button class="btn btn--danger btn--small" type="button" @click="remove(g)">
              Supprimer
            </button>
          </div>
        </li>
      </ul>
    </section>
  </AppLayout>
</template>
