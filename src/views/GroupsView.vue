<script setup>
import { computed, onMounted, ref } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import AddDependentModal from '@/components/AddDependentModal.vue'
import DependentShopsModal from '@/components/DependentShopsModal.vue'
import { api, parseApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const rows = ref([])
const loading = ref(true)
const message = ref('')
const search = ref('')
const selected = ref(null)
const groupShops = ref([]) // shops where he holds a group: where dependents can be added
const showAdd = ref(false)
const notice = ref('')

const money = (n) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    n ?? 0,
  ) + ' DA'
const round2 = (n) => Math.round(n * 100) / 100

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? rows.value.filter((r) => r.name.toLowerCase().includes(q)) : rows.value
})

/** The connected customer: his own debt where he is holder, plus the groups he depends on. */
function buildMe(data) {
  const holderShops = data.shops.map((s) => ({
    shop_name: s.shop_name,
    role_in_group: 'titulaire',
    owed: s.members.find((m) => m.is_holder)?.owed ?? 0,
  }))
  const dependentShops = (data.memberships ?? []).map((g) => ({
    shop_name: g.shop_name,
    role_in_group: `à charge de ${g.holder_name}`,
    owed: null, // his own share is not exposed in groups he does not hold
    action: {
      kind: 'leave',
      key: `leave-${g.group_id}`,
      group_id: g.group_id,
      allowed: g.can_leave,
      hint: "Vous devez rester membre d'au moins un groupe dans cette boutique.",
    },
  }))
  const shops = [...holderShops, ...dependentShops]

  return {
    person_id: auth.person?.id,
    name: auth.person?.name ?? '',
    isMe: true,
    shops,
    owed: round2(holderShops.reduce((sum, s) => sum + s.owed, 0)),
  }
}

/** One row per dependent, aggregated across the shops where he is the holder. */
function buildDependents(shops) {
  const byPerson = new Map()
  for (const shop of shops.filter((s) => s.type === 'group')) {
    for (const m of shop.members.filter((x) => !x.is_holder)) {
      if (!byPerson.has(m.person_id)) {
        byPerson.set(m.person_id, {
          person_id: m.person_id,
          name: m.name,
          isMe: false,
          owed: 0,
          shops: [],
        })
      }
      const row = byPerson.get(m.person_id)
      row.owed = round2(row.owed + m.owed)
      row.shops.push({
        shop_name: shop.shop_name,
        role_in_group: m.role_in_group,
        owed: m.owed,
        action: {
          kind: 'remove',
          key: `remove-${shop.id}-${m.shop_customer_id}`,
          group_id: shop.id,
          shop_customer_id: m.shop_customer_id,
          allowed: m.groups_count > 1, // only people who belong to more than one group
          hint: "Cette personne n'appartient qu'à ce groupe : elle ne peut pas être retirée.",
        },
      })
    }
  }
  return [...byPerson.values()].sort((a, b) => b.owed - a.owed)
}

const busyKey = ref(null)
const modalError = ref('')

async function load() {
  const { data } = await api.get('/customer/dashboard')
  groupShops.value = data.shops
    .filter((s) => s.type === 'group')
    .map((s) => ({ group_id: s.id, shop_name: s.shop_name }))
  const me = buildMe(data)
  const dependents = buildDependents(data.shops)
  rows.value = me.shops.length ? [me, ...dependents] : dependents // he is always first
}

async function detach(shop) {
  const a = shop.action
  const question = selected.value.isMe
    ? `Quitter le groupe de la boutique « ${shop.shop_name} » ?`
    : `Retirer ${selected.value.name} de votre groupe dans « ${shop.shop_name} » ? Cette personne restera dans ses autres groupes.`
  if (!window.confirm(question)) return

  modalError.value = ''
  busyKey.value = a.key
  try {
    if (a.kind === 'leave') {
      await api.post(`/customer/groups/${a.group_id}/leave`)
    } else {
      await api.delete(`/customer/groups/${a.group_id}/dependents/${a.shop_customer_id}`)
    }
    const personId = selected.value.person_id
    await load()
    // Keep the modal open on the refreshed row, or close it if nothing is left.
    const fresh = rows.value.find((r) => r.person_id === personId)
    selected.value = fresh && fresh.shops.length ? fresh : null
  } catch (e) {
    const err = parseApiError(e)
    modalError.value = err.fields.group?.[0] ?? err.message
  } finally {
    busyKey.value = null
  }
}

async function onAdded(text) {
  showAdd.value = false
  notice.value = text
  try {
    await load()
  } catch (e) {
    message.value = parseApiError(e).message
  }
}

function closeModal() {
  selected.value = null
  modalError.value = ''
}

onMounted(async () => {
  try {
    await load()
  } catch (e) {
    message.value = parseApiError(e).message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AppLayout>
    <h1 class="page__title">Groupes</h1>
    <p class="page__lead">Vous et vos personnes à charge : boutiques concernées et montants dus.</p>

    <p v-if="message" class="alert" role="alert">{{ message }}</p>
    <p v-if="notice" class="alert alert--ok" role="status">{{ notice }}</p>
    <p v-if="loading" class="muted">Chargement…</p>

    <div v-else-if="!rows.length && !message" class="empty">
      <p>Vous n'êtes rattaché à aucune boutique pour le moment.</p>
    </div>

    <section v-else-if="!message" class="section section--first">
      <div class="section__bar">
        <h2 class="section-title">Personnes</h2>
        <div class="section__tools">
          <input
            v-model="search"
            class="search"
            type="search"
            placeholder="Rechercher par nom…"
            aria-label="Rechercher une personne"
          />
          <button
            class="btn btn--primary btn--inline"
            type="button"
            :disabled="!groupShops.length"
            :title="groupShops.length ? '' : 'Vous n\'êtes titulaire d\'aucun groupe'"
            @click="showAdd = true"
          >
            + Ajouter une personne à charge
          </button>
        </div>
      </div>

      <div v-if="!filtered.length" class="empty">
        <p>Aucun résultat pour « {{ search }} ».</p>
      </div>

      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th scope="col">Nom</th>
              <th scope="col">Boutiques</th>
              <th scope="col" class="num">Dû</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in filtered" :key="r.person_id" :class="{ 'row--me': r.isMe }">
              <td>
                {{ r.name }}
                <span v-if="r.isMe" class="badge">Vous</span>
              </td>
              <td>
                <button v-if="r.shops.length" class="link-btn" type="button" @click="selected = r">
                  {{ r.shops.length }} boutique{{ r.shops.length > 1 ? 's' : '' }}
                </button>
                <span v-else class="muted">—</span>
              </td>
              <td class="num">
                <span class="owed" :class="{ 'owed--zero': r.owed === 0 }">{{
                  money(r.owed)
                }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </AppLayout>

  <AddDependentModal
    v-if="showAdd"
    :shops="groupShops"
    @close="showAdd = false"
    @success="onAdded"
  />
  <DependentShopsModal
    v-if="selected"
    :dependent="selected"
    :busy-key="busyKey"
    :error="modalError"
    @close="closeModal"
    @detach="detach"
  />
</template>
