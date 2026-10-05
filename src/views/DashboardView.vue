<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { parseApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useGroupsStore } from '@/stores/groups'

const auth = useAuthStore()
const groupsStore = useGroupsStore()

const loading = ref(true)
const message = ref('')

const name = computed(() => (auth.person?.name ?? ''))
const totalMembers = computed(() =>
  groupsStore.groups.reduce((sum, g) => sum + (g.members_count ?? 0), 0),
)
const recentGroups = computed(() => groupsStore.groups.slice(0, 3))

onMounted(async () => {
  try {
    await groupsStore.fetchGroups()
  } catch (e) {
    message.value = parseApiError(e).message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AppLayout>
    <div class="page__top">
      <div>
        <h1 class="page__title">Bonjour, {{ name }}</h1>
        <p class="page__lead">Voici un aperçu de votre espace Cardini RDV.</p>
      </div>
      <RouterLink :to="{ name: 'groups' }" class="btn btn--primary">Gérer mes groupes</RouterLink>
    </div>

    <p v-if="message" class="alert" role="alert">{{ message }}</p>

    <section class="stats" aria-label="Chiffres clés">
      <div class="stat">
        <p class="stat__value">{{ loading ? '–' : groupsStore.groups.length }}</p>
        <p class="stat__label">Groupes</p>
      </div>
      <div class="stat">
        <p class="stat__value">{{ loading ? '–' : totalMembers }}</p>
        <p class="stat__label">Membres au total</p>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">Vos groupes récents</h2>

      <p v-if="loading" class="muted">Chargement…</p>

      <div v-else-if="!recentGroups.length" class="empty">
        <p>Vous n'avez pas encore de groupe.</p>
        <RouterLink :to="{ name: 'groups' }" class="btn btn--ghost btn--small"
          >Créer un groupe</RouterLink
        >
      </div>

      <ul v-else class="list">
        <li v-for="g in recentGroups" :key="g.id" class="row">
          <div>
            <p class="row__title">{{ g.name }}</p>
            <p class="row__meta">
              {{ g.members_count }} membre{{ g.members_count > 1 ? 's' : '' }}
            </p>
          </div>
          <RouterLink
            :to="{ name: 'group-detail', params: { id: g.id } }"
            class="btn btn--ghost btn--small"
          >
            Gérer
          </RouterLink>
        </li>
      </ul>
    </section>
  </AppLayout>
</template>
