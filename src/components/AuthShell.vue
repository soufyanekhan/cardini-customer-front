<script setup>
defineProps({ title: String, subtitle: String })

const slots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30']
</script>

<template>
  <div class="shell">
    <aside class="shell__side" aria-hidden="true">
      <p class="brand brand--light">Cardini <span>RDV</span></p>
      <p class="shell__pitch">Votre prochain rendez-vous, réservé en quelques instants.</p>
      <ul class="slots">
        <li
          v-for="s in slots"
          :key="s"
          class="slots__item"
          :class="{ 'slots__item--picked': s === '10:30' }"
        >
          {{ s }}
        </li>
      </ul>
    </aside>

    <main class="shell__main">
      <p class="brand brand--mobile">Cardini <span>RDV</span></p>
      <div class="shell__panel">
        <h1 class="shell__title">{{ title }}</h1>
        <p class="shell__subtitle">{{ subtitle }}</p>
        <slot />
        <div class="shell__footer"><slot name="footer" /></div>
      </div>
    </main>
  </div>
</template>
