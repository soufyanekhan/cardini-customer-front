<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function logout() {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="page">
    <header class="page__header">
      <RouterLink :to="{ name: 'dashboard' }" class="brand brand--link"
        >Cardini <span>RDV</span></RouterLink
      >

      <nav class="nav" aria-label="Navigation principale">
        <RouterLink :to="{ name: 'dashboard' }" class="nav__link">Tableau de bord</RouterLink>
        <RouterLink :to="{ name: 'groups' }" class="nav__link">Groupes</RouterLink>
        <RouterLink :to="{ name: 'profile' }" class="nav__link">Profil</RouterLink>
      </nav>

      <button class="btn btn--ghost" type="button" @click="logout">Se déconnecter</button>
    </header>

    <main class="page__main">
      <slot />
    </main>
  </div>
</template>
