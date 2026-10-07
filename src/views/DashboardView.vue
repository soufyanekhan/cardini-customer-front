<script setup>
import { computed, onMounted, ref } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import ShopDetailModal from '@/components/ShopDetailModal.vue'
import { api, parseApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const summary = ref(null)
const shops = ref([])
const memberships = ref([])
const loading = ref(true)
const message = ref('')
const detailShop = ref(null)
const tab = ref('mine') // 'mine' | 'dependent'
const tabs = computed(() => [
  { id: 'mine', label: 'Mes boutiques', count: shops.value.length },
  { id: 'dependent', label: 'Je suis à charge', count: memberships.value.length },
])

function moveTab(event) {
  const ids = tabs.value.map((t) => t.id)
  const i = ids.indexOf(tab.value)
  const next = event.key === 'ArrowRight' ? (i + 1) % ids.length : (i - 1 + ids.length) % ids.length
  tab.value = ids[next]
  document.getElementById(`tab-${ids[next]}`)?.focus()
}

const firstName = computed(() => (auth.person?.name ?? '').split(' ')[0])

const money = (n) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    n ?? 0,
  ) + ' DA'
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—')
const keyOf = (s) => `${s.type}-${s.id}`
const dependentsCount = (s) => s.members.filter((m) => !m.is_holder).length

onMounted(async () => {
  try {
    const { data } = await api.get('/customer/dashboard')
    summary.value = data.summary
    shops.value = data.shops
    memberships.value = data.memberships ?? []
    // Nothing as holder but dependent somewhere: open that tab directly.
    if (!shops.value.length && memberships.value.length) tab.value = 'dependent'
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

    <div
      class="tabs"
      role="tablist"
      aria-label="Mes boutiques"
      @keydown.right.prevent="moveTab"
      @keydown.left.prevent="moveTab"
    >
      <button
        v-for="t in tabs"
        :id="`tab-${t.id}`"
        :key="t.id"
        class="tab"
        type="button"
        role="tab"
        :aria-selected="tab === t.id"
        :aria-controls="`panel-${t.id}`"
        :tabindex="tab === t.id ? 0 : -1"
        @click="tab = t.id"
      >
        {{ t.label }} <span class="tab__count">{{ t.count }}</span>
      </button>
    </div>

    <p v-if="loading" class="muted tabpanel">Chargement…</p>

    <!-- Tab 1: shops where he is the holder -->
    <section
      v-else-if="tab === 'mine'"
      id="panel-mine"
      class="tabpanel"
      role="tabpanel"
      aria-labelledby="tab-mine"
    >
      <div v-if="!shops.length && !message" class="empty">
        <p>Vous n'êtes titulaire d'aucune boutique pour le moment.</p>
      </div>

      <ul v-else class="list">
        <li v-for="s in shops" :key="keyOf(s)" class="shop">
          <div class="shop__head">
            <div>
              <p class="row__title">{{ s.shop_name }}</p>
              <p class="row__meta">
                {{ dependentsCount(s) }} personne{{ dependentsCount(s) > 1 ? 's' : '' }} à charge
                <template v-if="s.next_due_date && !s.overdue_count">
                  · prochaine échéance {{ formatDate(s.next_due_date) }}</template
                >
              </p>
              <p v-if="s.overdue_count > 0" class="overdue-line">
                En retard depuis le {{ formatDate(s.overdue_since) }} ·
                {{ s.max_days_overdue }} jour{{ s.max_days_overdue > 1 ? 's' : '' }}
                <span class="badge badge--danger"
                  >{{ s.overdue_count }} dette{{ s.overdue_count > 1 ? 's' : '' }}</span
                >
              </p>
            </div>

            <div class="shop__right">
              <p class="shop__owed" :class="{ 'shop__owed--zero': s.owed === 0 }">
                {{ s.owed === 0 ? 'À jour' : money(s.owed) }}
              </p>
              <button class="btn btn--ghost btn--small" type="button" @click="detailShop = s">
                Détails
              </button>
            </div>
          </div>
        </li>
      </ul>
    </section>

    <!-- Tab 2: shops where he is a dependent of someone else's group -->
    <section
      v-else
      id="panel-dependent"
      class="tabpanel"
      role="tabpanel"
      aria-labelledby="tab-dependent"
    >
      <p class="muted section__note">
        Vous faites partie du groupe d'un autre titulaire dans ces boutiques.
      </p>

      <div v-if="!memberships.length" class="empty">
        <p>Vous n'êtes à charge d'aucun titulaire pour le moment.</p>
      </div>

      <ul v-else class="list">
        <li v-for="g in memberships" :key="g.group_id" class="row">
          <div>
            <p class="row__title">{{ g.shop_name }}</p>
            <p class="row__meta">
              Titulaire : {{ g.holder_name }} · hors votre part et les personnes partagées
            </p>
          </div>
          <p class="shop__owed" :class="{ 'shop__owed--zero': g.owed === 0 }">
            {{ g.owed === 0 ? 'À jour' : money(g.owed) }}
          </p>
        </li>
      </ul>
    </section>
  </AppLayout>

  <ShopDetailModal v-if="detailShop" :shop="detailShop" @close="detailShop = null" />
</template>
