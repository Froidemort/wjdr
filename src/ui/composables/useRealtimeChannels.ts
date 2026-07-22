import type { RealtimeChannel } from '@supabase/supabase-js'
import { onBeforeUnmount } from 'vue'
import { supabase } from '../../db/supabase'

type RealtimeEvent = '*' | 'INSERT' | 'UPDATE' | 'DELETE'

export interface RealtimeTableSubscription {
  table: string
  filter?: string
  schema?: string
  event?: RealtimeEvent
}

export interface RealtimeUpdatePayload {
  table: string
  event: RealtimeEvent
}

interface UseRealtimeChannelsOptions {
  debounceMs?: number
}

export function useRealtimeChannels(
  onUpdate: (payload?: RealtimeUpdatePayload) => void,
  options: UseRealtimeChannelsOptions = {}
) {
  const debounceMs = options.debounceMs ?? 0
  let channel: RealtimeChannel | null = null
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let latestPayload: RealtimeUpdatePayload | undefined

  function dispatchUpdate(payload?: RealtimeUpdatePayload): void {
    if (debounceMs <= 0) {
      onUpdate(payload)
      return
    }

    latestPayload = payload

    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(() => {
      onUpdate(latestPayload)
      latestPayload = undefined
    }, debounceMs)
  }

  function subscribe(channelName: string, subscriptions: RealtimeTableSubscription[]): void {
    unsubscribe()
    if (subscriptions.length === 0) {
      return
    }

    let nextChannel = supabase.channel(channelName)

    for (const subscription of subscriptions) {
      const event = subscription.event ?? '*'
      const schema = subscription.schema ?? 'public'

      nextChannel = nextChannel.on(
        'postgres_changes',
        {
          event,
          schema,
          table: subscription.table,
          filter: subscription.filter,
        },
        () => {
          dispatchUpdate({
            table: subscription.table,
            event,
          })
        }
      )
    }

    channel = nextChannel.subscribe()
  }

  function unsubscribe(): void {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }

    latestPayload = undefined

    if (channel) {
      void supabase.removeChannel(channel)
      channel = null
    }
  }

  onBeforeUnmount(unsubscribe)

  return {
    subscribe,
    unsubscribe,
  }
}
