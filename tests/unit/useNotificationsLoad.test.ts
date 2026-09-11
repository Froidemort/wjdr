import { beforeEach, describe, expect, it, vi } from 'vitest'

const dependencies = vi.hoisted(() => ({
  listNotifications: vi.fn(),
  realtimeSync: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
}))

vi.mock('../../src/services/notificationsRepository', () => ({
  listNotificationsForUserPaginated: dependencies.listNotifications,
}))

vi.mock('../../src/composables/useRealtimeSync', () => ({
  useRealtimeSync: dependencies.realtimeSync,
}))

import { useNotificationsLoad } from '../../src/composables/useNotificationsLoad'

describe('useNotificationsLoad', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    dependencies.realtimeSync.mockReturnValue({ start: dependencies.start, stop: dependencies.stop })
  })

  it('clears notifications when no user is available', async () => {
    const loader = useNotificationsLoad({ userId: () => undefined, page: () => 1, pageSize: 12 })
    loader.notifications.value = [{ id: 'notification-1' } as never]
    loader.totalNotifications.value = 1

    await loader.load()

    expect(loader.notifications.value).toEqual([])
    expect(loader.totalNotifications.value).toBe(0)
    expect(dependencies.listNotifications).not.toHaveBeenCalled()
  })

  it('loads a page and subscribes to user notifications', async () => {
    const items = [{ id: 'notification-1' }]
    dependencies.listNotifications.mockResolvedValue({ items, total: 4 })
    const loader = useNotificationsLoad({ userId: () => 'user-1', page: () => 2, pageSize: 12 })

    await loader.load()
    loader.subscribe('user-1')

    expect(dependencies.listNotifications).toHaveBeenCalledWith('user-1', 2, 12)
    expect(loader.notifications.value).toEqual(items)
    expect(loader.totalNotifications.value).toBe(4)
    expect(dependencies.start).toHaveBeenCalledWith('notifications-user-1', [
      { table: 'notifications', filter: 'receiver_user_id=eq.user-1' },
    ])
    expect(loader.unsubscribe).toBe(dependencies.stop)
  })

  it('exposes loading errors and always clears the loading flag', async () => {
    dependencies.listNotifications.mockRejectedValue(new Error('Indisponible'))
    const loader = useNotificationsLoad({ userId: () => 'user-1', page: () => 1, pageSize: 12 })

    await loader.load()

    expect(loader.error.value).toBe('Indisponible')
    expect(loader.loading.value).toBe(false)
  })
})