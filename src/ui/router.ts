import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAuthModalStore } from '../stores/authModal'
import CharacterDetailView from './views/CharacterDetailView.vue'
import CharacterListView from './views/CharacterListView.vue'
import HomeView from './views/HomeView.vue'
import NotificationsView from './views/NotificationsView.vue'
import ProfileView from './views/ProfileView.vue'
import SessionDetailView from './views/SessionDetailView.vue'
import SessionListView from './views/SessionListView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Page d'accueil
    {
      path: '/',
      component: HomeView,
      meta: { requiresAuth: false },
    },
    // Liste des personnages avec quelques détails
    {
      path: '/characters',
      component: CharacterListView,
      meta: { requiresAuth: true },
    },
    // Liste des sessions avec quelque détails, et possibilité de créer un personnage
    {
      path: '/sessions',
      component: SessionListView,
      meta: { requiresAuth: true },
    },
    // Page de détail d'un personnage, surtout utile pour un joueur qui veut gérer sa fiche pendant une partie
    {
      path: '/characters/:id',
      component: CharacterDetailView,
      props: true,
      meta: { requiresAuth: true },
    },
    {
      path: '/notifications',
      component: NotificationsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      component: ProfileView,
      meta: { requiresAuth: true },
    },
    // Page de détail d'une session, permet de voir la liste des sessions, et éventuellement d'en créer une nouvelle en tant que MJ.
    // La page permet de voir rapidement :
    // - le rôle qu'a l'utilisateur dans la session (PJ ou MJ)
    // - la liste des personnages avec leur nom, leur race et leur carrière actuelle.
    {
      path: '/sessions/:id',
      component: SessionDetailView,
      props: true,
      meta: { requiresAuth: true },
    },
  ],
})
router.beforeEach(async (to, _from, next) => {
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const authStore = useAuthStore()

  if (!authStore.initialized) {
    try {
      await authStore.initAuth()
    } catch {
      // Keep guard behavior below for unauthenticated fallback.
    }
  }

  const isConnected = authStore.isAuthenticated

  if (requiresAuth && !isConnected) {
    const authModalStore = useAuthModalStore()
    authModalStore.openModal('login')
    next({ path: '/' })
    return
  }

  next()
})

export default router
