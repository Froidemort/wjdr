import { onBeforeUnmount } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../../db/supabase'

type RealtimeEvent = '*' | 'INSERT' | 'UPDATE' | 'DELETE'

export interface RealtimeTableSubscription {
  table: string
  filter?: string
  schema?: string
  event?: RealtimeEvent
}

interface UseRealtimeChannelsOptions {
  debounceMs?: number
}

export function useRealtimeChannels(onUpdate: () => void, options: UseRealtimeChannelsOptions = {}) {
  const debounceMs = options.debounceMs ?? 0
  let channel: RealtimeChannel | null = null
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function dispatchUpdate(): void {
    if (debounceMs <= 0) {
      onUpdate()
      return
    }

    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    debounceTimer = setTimeout(() => {
      onUpdate()
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
          filter: subscription.filter
        },
        () => {
          dispatchUpdate()
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

    if (channel) {
      void supabase.removeChannel(channel)
      channel = null
    }
  }

  onBeforeUnmount(unsubscribe)

  return {
    subscribe,
    unsubscribe
  }
}