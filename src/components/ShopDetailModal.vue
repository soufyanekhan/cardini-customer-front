<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import OperationsModal from '@/components/OperationsModal.vue'

const props = defineProps({
  /** A shop of the dashboard payload (type, id, shop_name, owed, members, overdue_since, max_days_overdue…) */
  shop: { type: Object, required: true },
})
const emit = defineEmits(['close'])

const showOperations = ref(false)
const closeBtn = ref(null)

const money = (n) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    n ?? 0,
  ) + ' DA'
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—')

function onKey(e) {
  if (e.key === 'Escape' && !showOperations.value) emit('close')
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
      class="modal-box modal-box--wide"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shop-title"
    >
      <div class="modal-header">
        <h2 id="shop-title" class="modal-title">{{ shop.shop_name }}</h2>
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

      <p v-if="shop.overdue_count > 0" class="alert modal-alert" role="status">
        Dette en retard depuis le {{ formatDate(shop.overdue_since) }} ·
        {{ shop.max_days_overdue }} jour{{ shop.max_days_overdue > 1 ? 's' : '' }} de retard
      </p>

      <div class="modal-body modal-body--table">
        <table class="table">
          <thead>
            <tr>
              <th scope="col">Nom</th>
              <th scope="col">Rôle</th>
              <th scope="col">Dernier achat</th>
              <th scope="col" class="num">Dû</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in shop.members" :key="m.shop_customer_id">
              <td>
                {{ m.name }}
                <span v-if="m.is_holder" class="badge">Titulaire</span>
              </td>
              <td>
                <span v-if="m.role_in_group" class="role">{{ m.role_in_group }}</span>
                <span v-else class="muted">—</span>
              </td>
              <td>{{ formatDate(m.last_purchase_date) }}</td>
              <td class="num">
                <span class="owed" :class="{ 'owed--zero': m.owed === 0 }">{{
                  money(m.owed)
                }}</span>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colspan="3">Total dû</th>
              <td class="num">
                <strong>{{ money(shop.owed) }}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="modal-footer modal-footer--between">
        <button class="btn btn--ghost" type="button" @click="showOperations = true">
          Voir toutes les opérations
        </button>
        <button class="btn btn--ghost" type="button" @click="emit('close')">Fermer</button>
      </div>
    </div>
  </div>

  <OperationsModal
    v-if="showOperations"
    :type="shop.type"
    :id="shop.id"
    :title="shop.shop_name"
    @close="emit('close')"
    @back="showOperations = false"
  />
</template>
