import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAuthFormStore } from '../stores/authForm'
import { appRoutes } from './routes'

let didPrefetchFrequentViews = false

function prefetchFrequentAuthenticatedViews(): void {
  if (didPrefetchFrequentViews) {
    return
  }

  didPrefetchFrequentViews = true
  void Promise.allSettled([
    import('../views/CampaignListView.vue'),
    import('../views/CampaignDetailView.vue'),
    import('../views/CharacterDetailView.vue'),
  ])
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: appRoutes,
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

  if (isConnected) {
    prefetchFrequentAuthenticatedViews()
  }

  if (requiresAuth && !isConnected) {
    useAuthFormStore().setMode('login')
    next({ path: '/' })
    return
  }

  next()
})

export default router
