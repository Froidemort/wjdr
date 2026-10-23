import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

/** Shared sign-out flow; `beforeSignOut` lets the caller close its menu first. */
export function useLogout(beforeSignOut?: () => void) {
  const authStore = useAuthStore()
  const router = useRouter()

  async function logout(): Promise<void> {
    beforeSignOut?.()
    await authStore.signOut()
    await router.replace('/')
  }

  return { logout }
}
