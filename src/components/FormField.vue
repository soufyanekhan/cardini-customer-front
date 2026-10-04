<script setup>
import { computed, useId } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  autocomplete: String,
  inputmode: String,
  hint: String,
  errors: { type: Array, default: () => [] },
  optional: Boolean,
  readonly: Boolean,
})

const model = defineModel({ type: String, default: '' })
const id = useId()
const describedBy = computed(() =>
  props.errors.length ? `${id}-err` : props.hint ? `${id}-hint` : undefined,
)
</script>

<template>
  <div class="field" :class="{ 'field--error': errors.length }">
    <label :for="id" class="field__label">
      {{ label }}<span v-if="optional" class="field__optional"> (facultatif)</span>
    </label>
    <input
      :id="id"
      v-model="model"
      class="field__input"
      :type="type"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :readonly="readonly"
      :aria-invalid="errors.length ? true : undefined"
      :aria-describedby="describedBy"
    />
    <p v-if="errors.length" :id="`${id}-err`" class="field__error" role="alert">{{ errors[0] }}</p>
    <p v-else-if="hint" :id="`${id}-hint`" class="field__hint">{{ hint }}</p>
  </div>
</template>
