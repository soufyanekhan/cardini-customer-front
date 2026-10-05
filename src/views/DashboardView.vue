<script setup>
import { computed, onMounted, ref } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { api, parseApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const summary = ref(null)
const shops = ref([])
const loading = ref(true)
const message = ref('')
const expanded = ref({})

const firstName = computed(() => (auth.person?.name ?? '').split(' ')[0])

const money = (n) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    n ?? 0,
  ) + ' DA'
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—')
const keyOf = (s) => `${s.type}-${s.id}`
const dependentsCount = (s) => s.members.filter((m) => !m.is_holder).length

function toggle(s) {
  expanded.value[keyOf(s)] = !expanded.value[keyOf(s)]
}

onMounted(async () => {
  try {
    const { data } = await api.get('/customer/dashboard')
    summary.value = data.summary
    shops.value = data.shops
  } catch (e) {
    message.value = parseApiError(e).message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AppLayout>
    <h1 class="page__title">Bonjour, {{ firstName }}</h1>
    <p class="page__lead">
      Ce que vous devez, vous et les personnes à votre charge, dans chacune de vos boutiques.
    </p>

    <p v-if="message" class="alert" role="alert">{{ message }}</p>

    <section v-if="summary" class="stats" aria-label="Résumé">
      <div class="stat">
        <p class="stat__value">{{ money(summary.total_owed) }}</p>
        <p class="stat__label">Total à payer</p>
      </div>
      <div class="stat">
        <p class="stat__value">{{ summary.shops_count }}</p>
        <p class="stat__label">Boutiques</p>
      </div>
      <div class="stat" :class="{ 'stat--warn': summary.overdue_count > 0 }">
        <p class="stat__value">{{ summary.overdue_count }}</p>
        <p class="stat__label">Dettes en retard</p>
      </div>
    </section>

    <section class="section">
      <h2 class="section-title">Mes boutiques</h2>

      <p v-if="loading" class="muted">Chargement…</p>

      <div v-else-if="!shops.length && !message" class="empty">
        <p>Vous n'êtes rattaché à aucune boutique pour le moment.</p>
      </div>

      <ul v-else class="list">
        <li v-for="s in shops" :key="keyOf(s)" class="shop">
          <div class="shop__head">
            <div>
              <p class="row__title">{{ s.shop_name }}</p>
              <p class="row__meta">
                {{ dependentsCount(s) }} personne{{ dependentsCount(s) > 1 ? 's' : '' }} à charge
                <template v-if="s.next_due_date">
                  · prochaine échéance {{ formatDate(s.next_due_date) }}</template
                >
              </p>
            </div>

            <div class="shop__right">
              <p class="shop__owed" :class="{ 'shop__owed--zero': s.owed === 0 }">
                {{ s.owed === 0 ? 'À jour' : money(s.owed) }}
              </p>
              <span v-if="s.overdue_count > 0" class="badge badge--danger">
                {{ s.overdue_count }} en retard
              </span>
              <button
                class="btn btn--ghost btn--small"
                type="button"
                :aria-expanded="!!expanded[keyOf(s)]"
                @click="toggle(s)"
              >
                {{ expanded[keyOf(s)] ? 'Masquer' : 'Détails' }}
              </button>
            </div>
          </div>

          <ul v-if="expanded[keyOf(s)]" class="shop__body">
            <li v-for="m in s.members" :key="m.shop_customer_id" class="member">
              <span>
                {{ m.name }}
                <span v-if="m.is_holder" class="badge">Titulaire</span>
                <span v-else-if="m.role_in_group" class="row__meta"> · {{ m.role_in_group }}</span>
              </span>
              <span :class="{ muted: m.owed === 0 }">{{ money(m.owed) }}</span>
            </li>
          </ul>
        </li>
      </ul>
    </section>
  </AppLayout>
</template>
