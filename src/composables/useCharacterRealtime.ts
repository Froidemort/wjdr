import { useDebounceFn } from '@vueuse/core'
import { onBeforeUnmount } from 'vue'
import { invalidateCharacterLinksCache } from '../services/characterLinksRepository'
import { type RealtimeUpdatePayload, useRealtimeChannels } from './useRealtimeChannels'

const LINK_TABLES = new Set([
  'character_skills',
  'character_talents',
  'character_weapons',
  'character_armors',
  'character_items',
])

interface UseCharacterRealtimeOptions {
  getCharacterId: () => string
  isSavingInProgress: () => boolean
  loadCharacter: (options: { background?: boolean }) => Promise<void>
  loadCharacterLinks: (characterId: string, options: { force?: boolean }) => Promise<void>
}

export function useCharacterRealtime({
  getCharacterId,
  isSavingInProgress,
  loadCharacter,
  loadCharacterLinks,
}: UseCharacterRealtimeOptions) {
  const scheduleDeferredLinksReload = useDebounceFn((currentCharacterId: string) => {
    void loadCharacterLinks(currentCharacterId, { force: true })
  }, 700)
  const scheduleDeferredRealtimeReload = useDebounceFn(() => {
    void loadCharacter({ background: true })
  }, 700)

  function requestExternalCharacterRefresh(update?: RealtimeUpdatePayload): void {
    const table = update?.table
    const currentCharacterId = getCharacterId()
    if (!currentCharacterId) {
      return
    }

    if (table && LINK_TABLES.has(table)) {
      invalidateCharacterLinksCache(currentCharacterId)

      if (isSavingInProgress()) {
        void scheduleDeferredLinksReload(currentCharacterId)
        return
      }

      void loadCharacterLinks(currentCharacterId, { force: true })
      return
    }

    if (isSavingInProgress()) {
      void scheduleDeferredRealtimeReload()
      return
    }

    void loadCharacter({ background: true })
  }

  const { subscribe: subscribeRealtime, unsubscribe: unsubscribeRealtime } = useRealtimeChannels(
    (update) => {
      requestExternalCharacterRefresh(update)
    },
    { debounceMs: 450 }
  )

  function cancelDeferred(): void {
    scheduleDeferredRealtimeReload.cancel()
    scheduleDeferredLinksReload.cancel()
  }

  onBeforeUnmount(cancelDeferred)

  return { subscribeRealtime, unsubscribeRealtime, cancelDeferred }
}
