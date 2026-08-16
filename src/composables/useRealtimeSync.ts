import type { RealtimePostgresChangesFilter } from '@supabase/supabase-js'
import { useRealtimeChannels } from './useRealtimeChannels'

interface RealtimeSyncSubscription {
  table: string
  filter?: string
  schema?: string
  event?: RealtimePostgresChangesFilter['event']
}

interface UseRealtimeSyncOptions {
  debounceMs?: number
  onUpdate: () => void | Promise<void>
}

export function useRealtimeSync(options: UseRealtimeSyncOptions) {
  const { subscribe, unsubscribe } = useRealtimeChannels(() => {
    void options.onUpdate()
  }, { debounceMs: options.debounceMs ?? 300 })

  function start(channelName: string, subscriptions: RealtimeSyncSubscription[]): void {
    subscribe(channelName, subscriptions)
  }

  function stop(): void {
    unsubscribe()
  }

  return {
    start,
    stop,
  }
}
