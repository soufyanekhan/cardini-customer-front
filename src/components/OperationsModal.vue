<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { api, parseApiError } from '@/lib/api'

const props = defineProps({
  type: { type: String, required: true }, // 'group' | 'customer'
  id: { type: Number, required: true },
  title: { type: String, default: '' },
})
const emit = defineEmits(['close', 'back'])

const operations = ref([])
const loading = ref(true)
const message = ref('')
const search = ref('')
const operationType = ref('')
const status = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const currentPage = ref(1)
const lastPage = ref(1)

const STATUS_LABELS = {
  open: 'Ouverte',
  partially_paid: 'Partielle',
  paid: 'Payée',
  overdue: 'En retard',
}
const money = (n) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number(n ?? 0),
  ) + ' DA'
const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'
const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

async function load(page = 1) {
  loading.value = true
  message.value = ''
  try {
    const { data } = await api.get('/customer/dashboard/operations', {
      params: {
        type: props.type,
        id: props.id,
        search: search.value || undefined,
        operation_type: operationType.value || undefined,
        status: status.value || undefined,
        date_from: dateFrom.value || undefined,
        date_to: dateTo.value || undefined,
        page,
      },
    })
    operations.value = data.data
    currentPage.value = data.current_page
    lastPage.value = data.last_page
  } catch (e) {
    message.value = parseApiError(e).message
  } finally {
    loading.value = false
  }
}

let timer = null
watch(search, () => {
  clearTimeout(timer)
  timer = setTimeout(() => load(1), 300)
})
watch([operationType, status, dateFrom, dateTo], () => load(1))

function goToPage(p) {
  if (p < 1 || p > lastPage.value) return
  load(p)
}

const pageList = computed(() => {
  const pages = []
  const total = lastPage.value
  const cur = currentPage.value
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (cur > 3) pages.push('...')
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
    if (cur < total - 2) pages.push('...')
    pages.push(total)
  }
  return pages
})

const typeLabel = (op) =>
  op.type === 'purchase' ? 'Achat' : op.is_cleared ? 'Apurement' : 'Paiement'
const typeClass = (op) =>
  op.type === 'purchase' ? 'purchase' : op.is_cleared ? 'cleared' : 'payment'

function onKey(e) {
  if (e.key === 'Escape') emit('back')
}
onMounted(() => {
  document.addEventListener('keydown', onKey)
  load()
})
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="modal-overlay modal-overlay--top" @click.self="emit('close')">
    <div
      class="modal-box modal-box--xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ops-title"
    >
      <div class="modal-header">
        <div>
          <button class="link-btn" type="button" @click="emit('back')">← Retour</button>
          <h2 id="ops-title" class="modal-title">{{ title }} — Toutes les opérations</h2>
        </div>
        <button class="modal-close" type="button" aria-label="Fermer" @click="emit('close')">
          ×
        </button>
      </div>

      <div class="ops-toolbar">
        <input
          v-model="search"
          class="search"
          type="search"
          placeholder="Nom, montant, statut…"
          aria-label="Rechercher"
        />
        <select v-model="operationType" class="search" aria-label="Type d'opération">
          <option value="">Tous les types</option>
          <option value="purchase">Achats</option>
          <option value="payment">Paiements</option>
        </select>
        <select v-model="status" class="search" aria-label="Statut">
          <option value="">Tous les statuts</option>
          <option value="open">Ouverte</option>
          <option value="partially_paid">Partielle</option>
          <option value="paid">Payée</option>
          <option value="overdue">En retard</option>
        </select>
        <input v-model="dateFrom" class="search" type="date" aria-label="Du" />
        <span class="muted">au</span>
        <input v-model="dateTo" class="search" type="date" aria-label="Au" />
      </div>

      <p v-if="message" class="alert modal-alert" role="alert">{{ message }}</p>

      <div class="modal-body modal-body--table">
        <p v-if="loading" class="muted ops-state">Chargement…</p>
        <p v-else-if="!operations.length && !message" class="muted ops-state">Aucune opération.</p>

        <table v-else class="table">
          <thead>
            <tr>
              <th scope="col">Type</th>
              <th scope="col">Membre</th>
              <th scope="col">Date</th>
              <th scope="col" class="num">Montant</th>
              <th scope="col" class="num">Solde</th>
              <th scope="col">Statut</th>
              <th scope="col">Détails</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="op in operations" :key="op.key">
              <td>
                <span class="type-pill" :class="typeClass(op)">{{ typeLabel(op) }}</span>
              </td>
              <td>{{ op.member_name }}</td>
              <td>
                {{ formatDateTime(op.date) }}
                <template v-if="op.type === 'purchase' && op.status !== 'paid' && op.due_date">
                  <br />
                  <span class="due" :class="{ 'due--late': op.days_overdue }">
                    Échéance {{ formatDate(op.due_date)
                    }}<template v-if="op.days_overdue">
                      · {{ op.days_overdue }} jour{{ op.days_overdue > 1 ? 's' : '' }} de
                      retard</template
                    >
                  </span>
                </template>
              </td>
              <td class="num">
                <span :class="op.type === 'purchase' ? 'debit' : 'credit'">
                  {{ op.type === 'purchase' ? '+' : '−' }}{{ money(op.amount) }}
                </span>
              </td>
              <td class="num">
                <span
                  :class="{ owed: op.balance_after > 0, 'owed--zero': !(op.balance_after > 0) }"
                >
                  {{ money(op.balance_after) }}
                </span>
              </td>
              <td>
                <span v-if="op.type === 'purchase'" class="status-pill" :class="op.status">
                  {{ STATUS_LABELS[op.status] ?? op.status }}
                </span>
                <span v-else class="muted">—</span>
              </td>
              <td class="row__meta">
                <template v-if="op.type === 'purchase'">
                  Payé {{ money(op.paid_so_far) }} / {{ money(op.original_owed) }}
                </template>
                <template v-else>
                  <span v-if="op.paid_by">Par {{ op.paid_by }}</span>
                  <span v-if="op.allocation_mode === 'manual'"> · manuel</span>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="lastPage > 1" class="pagination">
        <button type="button" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
          ‹
        </button>
        <template v-for="(p, i) in pageList" :key="i">
          <span v-if="p === '...'" class="ellipsis">…</span>
          <button v-else type="button" :class="{ active: p === currentPage }" @click="goToPage(p)">
            {{ p }}
          </button>
        </template>
        <button
          type="button"
          :disabled="currentPage === lastPage"
          @click="goToPage(currentPage + 1)"
        >
          ›
        </button>
      </div>
    </div>
  </div>
</template>
