<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  /**
   * { name, isMe?, owed, shops: [{
   *   shop_name, role_in_group, owed (null = not shown),
   *   action?: { kind: 'leave' | 'remove', key, allowed, hint }
   * }] }
   */
  dependent: { type: Object, required: true },
  busyKey: { type: String, default: null },
  error: { type: String, default: '' },
})
const emit = defineEmits(['close', 'detach'])

const closeBtn = ref(null)
const hasActions = computed(() => props.dependent.shops.some((s) => s.action))

const money = (n) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    n ?? 0,
  ) + ' DA'

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
      class="modal-box modal-box--wide"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dep-modal-title"
    >
      <div class="modal-header">
        <h2 id="dep-modal-title" class="modal-title">
          {{ dependent.isMe ? 'Mes boutiques' : `${dependent.name} — Boutiques` }}
        </h2>
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

      <p v-if="error" class="alert modal-alert" role="alert">{{ error }}</p>

      <div class="modal-body modal-body--table">
        <table class="table">
          <thead>
            <tr>
              <th scope="col">Boutique</th>
              <th scope="col">Rôle</th>
              <th scope="col" class="num">Dû</th>
              <th v-if="hasActions" scope="col" class="num">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(s, i) in dependent.shops" :key="`${s.shop_name}-${i}`">
              <td>{{ s.shop_name }}</td>
              <td>
                <span v-if="s.role_in_group" class="role">{{ s.role_in_group }}</span>
                <span v-else class="muted">—</span>
              </td>
              <td class="num">
                <span v-if="s.owed === null" class="muted">—</span>
                <span v-else class="owed" :class="{ 'owed--zero': s.owed === 0 }">{{
                  money(s.owed)
                }}</span>
              </td>
              <td v-if="hasActions" class="num">
                <button
                  v-if="s.action"
                  class="btn btn--danger btn--small"
                  type="button"
                  :disabled="!s.action.allowed || busyKey !== null"
                  :title="s.action.allowed ? '' : s.action.hint"
                  @click="emit('detach', s)"
                >
                  {{
                    busyKey === s.action.key
                      ? '…'
                      : s.action.kind === 'leave'
                        ? 'Quitter'
                        : 'Retirer'
                  }}
                </button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colspan="2">Total</th>
              <td class="num">
                <strong>{{ money(dependent.owed) }}</strong>
              </td>
              <td v-if="hasActions"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div v-if="hasActions" class="modal-hint">
        <p class="row__meta">
          Un bouton grisé signifie que l'action n'est pas possible : une personne doit rester membre
          d'au moins un groupe dans la boutique.
        </p>
      </div>

      <div class="modal-footer">
        <button class="btn btn--ghost" type="button" @click="emit('close')">Fermer</button>
      </div>
    </div>
  </div>
</template>
