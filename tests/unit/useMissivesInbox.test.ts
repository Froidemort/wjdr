import { beforeEach, describe, expect, it, vi } from 'vitest'

const dependencies = vi.hoisted(() => ({
  asyncList: vi.fn(),
  clear: vi.fn(),
  countUnread: vi.fn(),
  items: { value: [] },
  listNotifications: vi.fn(),
  load: vi.fn(),
  markRead: vi.fn(),
  realtime: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  user: null as { id: string } | null,
}))

vi.mock('../../src/stores/auth', () => ({ useAuthStore: () => ({ user: dependencies.user }) }))
vi.mock('../../src/services/notificationsRepository', () => ({
  countUnreadNotifications: dependencies.countUnread,
  listNotificationsForUser: dependencies.listNotifications,
  markNotificationRead: dependencies.markRead,
}))
vi.mock('../../src/composables/useAsyncList', () => ({
  useAsyncList: dependencies.asyncList,
}))
vi.mock('../../src/composables/useRealtimeSync', () => ({ useRealtimeSync: dependencies.realtime }))

import { useMissivesInbox } from '../../src/composables/useMissivesInbox'

describe('useMissivesInbox', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    dependencies.user = null
    dependencies.items.value = []
    dependencies.asyncList.mockReturnValue({ items: dependencies.items, error: { value: null }, load: dependencies.load, clear: dependencies.clear })
    dependencies.realtime.mockReturnValue({ start: dependencies.start, stop: dependencies.stop })
  })

  it('clears inbox state for anonymous users', async () => {
    const inbox = useMissivesInbox()

    await inbox.refreshMissives()

    expect(dependencies.clear).toHaveBeenCalledWith([])
    expect(inbox.unreadCount.value).toBe(0)
    expect(dependencies.stop).toHaveBeenCalledOnce()
  })

  it('refreshes counts and marks a notification as read for authenticated users', async () => {
    dependencies.user = { id: 'user-1' }
    dependencies.load.mockResolvedValue([])
    dependencies.countUnread.mockResolvedValue(3)
    dependencies.markRead.mockResolvedValue(undefined)
    const inbox = useMissivesInbox()

    await inbox.refreshMissives()
    await inbox.markMissiveAsRead('notification-1')

    expect(dependencies.countUnread).toHaveBeenCalledWith('user-1')
    expect(inbox.unreadCount.value).toBe(3)
    expect(dependencies.markRead).toHaveBeenCalledWith('notification-1')
    expect(dependencies.start).toHaveBeenCalledWith('navbar-missives-user-1', [
      { table: 'notifications', filter: 'receiver_user_id=eq.user-1' },
    ])
  })

  it('resets the unread count when refresh dependencies fail', async () => {
    dependencies.user = { id: 'user-1' }
    dependencies.load.mockRejectedValue(new Error('Indisponible'))
    dependencies.countUnread.mockResolvedValue(3)
    const inbox = useMissivesInbox()
    inbox.unreadCount.value = 2

    await inbox.refreshMissives()

    expect(inbox.unreadCount.value).toBe(0)
  })
})