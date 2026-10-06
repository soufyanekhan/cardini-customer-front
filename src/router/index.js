import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: { name: 'dashboard' } },
    {
      path: '/connexion',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true, title: 'Connexion' },
    },
    {
      path: '/inscription',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guestOnly: true, title: 'Créer un compte' },
    },
    {
      path: '/tableau-de-bord',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true, title: 'Tableau de bord' },
    },
    {
      path: '/groupes',
      name: 'groups',
      component: () => import('@/views/GroupsView.vue'),
      meta: { requiresAuth: true, title: 'Groupes' },
    },
    {
      path: '/profil',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true, title: 'Mon profil' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth) {
    if (!auth.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } }
    // Token survived a page reload but the profile is not loaded yet.
    if (!auth.person) {
      try {
        await auth.fetchMe()
      } catch {
        auth.clearSession()
        return { name: 'login', query: { expired: '1' } }
      }
    }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) return { name: 'dashboard' }
})

router.afterEach((to) => {
  document.title = `${to.meta.title ?? 'Accueil'} - Cardini RDV`
})

export default router
