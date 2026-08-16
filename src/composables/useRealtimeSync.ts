import { useRealtimeChannels } from './useRealtimeChannels'

type RealtimeEvent = '*' | 'INSERT' | 'UPDATE' | 'DELETE'

interface RealtimeSyncSubscription {
  table: string
  filter?: string
  schema?: string
  event?: RealtimeEvent
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
