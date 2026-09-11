import { beforeEach, describe, expect, it, vi } from 'vitest'

const channels = vi.hoisted(() => ({
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  useRealtimeChannels: vi.fn(),
}))

vi.mock('../../src/composables/useRealtimeChannels', () => ({
  useRealtimeChannels: channels.useRealtimeChannels,
}))

import { useRealtimeSync } from '../../src/composables/useRealtimeSync'

describe('useRealtimeSync', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    channels.useRealtimeChannels.mockReturnValue(channels)
  })

  it('forwards subscriptions and stops channels', () => {
    const sync = useRealtimeSync({ onUpdate: vi.fn(), debounceMs: 75 })
    const subscriptions = [{ table: 'notifications', filter: 'receiver_user_id=eq.user-1' }]

    sync.start('notifications-user-1', subscriptions)
    sync.stop()

    expect(channels.subscribe).toHaveBeenCalledWith('notifications-user-1', subscriptions)
    expect(channels.unsubscribe).toHaveBeenCalledOnce()
    expect(channels.useRealtimeChannels).toHaveBeenCalledWith(expect.any(Function), { debounceMs: 75 })
  })

  it('runs asynchronous update handlers without awaiting them', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined)
    useRealtimeSync({ onUpdate })

    await channels.useRealtimeChannels.mock.calls[0][0]()

    expect(onUpdate).toHaveBeenCalledOnce()
  })
})