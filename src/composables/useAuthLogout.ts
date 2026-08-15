import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

/** Signs out and redirects to the home page. Used by account popover and mobile menu. */
export function useAuthLogout() {
  const authStore = useAuthStore()
  const router = useRouter()

  return async (): Promise<void> => {
    await authStore.signOut()
    await router.replace('/')
  }
}
