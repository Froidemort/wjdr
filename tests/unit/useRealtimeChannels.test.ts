import { beforeEach, describe, expect, it, vi } from 'vitest'

const dependencies = vi.hoisted(() => ({
  cancel: vi.fn(),
  channel: vi.fn(),
  debounce: vi.fn(),
  removeChannel: vi.fn(),
}))

vi.mock('@vueuse/core', () => ({
  useDebounceFn: dependencies.debounce,
}))

vi.mock('../../src/db/supabase', () => ({
  supabase: {
    channel: dependencies.channel,
    removeChannel: dependencies.removeChannel,
  },
}))

import { useRealtimeChannels } from '../../src/composables/useRealtimeChannels'

function createChannel() {
  const channel = {
    on: vi.fn(),
    subscribe: vi.fn(),
  }
  channel.on.mockReturnValue(channel)
  channel.subscribe.mockReturnValue(channel)
  return channel
}

describe('useRealtimeChannels', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    dependencies.debounce.mockImplementation((callback: () => void) => {
      const debounced = () => callback()
      Object.assign(debounced, { cancel: dependencies.cancel })
      return debounced
    })
  })

  it('subscribes to tables and immediately forwards received payloads', () => {
    const channel = createChannel()
    const onUpdate = vi.fn()
    dependencies.channel.mockReturnValue(channel)
    const realtime = useRealtimeChannels(onUpdate)

    realtime.subscribe('campaign-1', [
      { table: 'sessions' },
      { table: 'session_notes', event: 'UPDATE', schema: 'custom', filter: 'campaign_id=eq.campaign-1' },
    ])
    channel.on.mock.calls[0][2]()
    channel.on.mock.calls[1][2]()

    expect(channel.on).toHaveBeenNthCalledWith(1, 'postgres_changes', {
      event: '*', schema: 'public', table: 'sessions', filter: undefined,
    }, expect.any(Function))
    expect(onUpdate).toHaveBeenNthCalledWith(1, { table: 'sessions', event: '*' })
    expect(onUpdate).toHaveBeenNthCalledWith(2, { table: 'session_notes', event: 'UPDATE' })
    expect(channel.subscribe).toHaveBeenCalledOnce()
  })

  it('debounces updates and removes previous channels on replacement or unsubscribe', () => {
    const firstChannel = createChannel()
    const secondChannel = createChannel()
    dependencies.channel.mockReturnValueOnce(firstChannel).mockReturnValueOnce(secondChannel)
    const onUpdate = vi.fn()
    const realtime = useRealtimeChannels(onUpdate, { debounceMs: 50 })

    realtime.subscribe('first', [{ table: 'sessions' }])
    firstChannel.on.mock.calls[0][2]()
    realtime.subscribe('second', [{ table: 'sessions' }])
    realtime.unsubscribe()

    expect(onUpdate).toHaveBeenCalledWith({ table: 'sessions', event: '*' })
    expect(dependencies.cancel).toHaveBeenCalledTimes(3)
    expect(dependencies.removeChannel).toHaveBeenNthCalledWith(1, firstChannel)
    expect(dependencies.removeChannel).toHaveBeenNthCalledWith(2, secondChannel)
  })

  it('does not create a channel for an empty subscription list', () => {
    const realtime = useRealtimeChannels(vi.fn())

    realtime.subscribe('empty', [])

    expect(dependencies.channel).not.toHaveBeenCalled()
    expect(dependencies.cancel).toHaveBeenCalledOnce()
  })
})