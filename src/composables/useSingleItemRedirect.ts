import { useRoute, useRouter } from 'vue-router'

// Skips the list page when the user owns a single item, unless `?all=1` asks for the full list.
export function useSingleItemRedirect() {
  const route = useRoute()
  const router = useRouter()

  async function redirectIfSingle<T>(items: readonly T[], buildTo: (item: T) => string): Promise<boolean> {
    if (route.query.all === '1' || items.length !== 1) {
      return false
    }

    await router.replace(buildTo(items[0]))
    return true
  }

  return { redirectIfSingle }
}
