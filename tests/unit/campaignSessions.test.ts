import { describe, expect, it } from 'vitest'
import type { SessionSummary } from '../../src/types/domain'
import {
  filterCampaignSessions,
  formatCampaignSessionDateKey,
  getCampaignSessionDateStatus,
  getCampaignSessionCalendarGrid,
  getCampaignSessionTodayKey,
  parseCampaignSessionDate,
  sortCampaignSessionsByDate,
} from '../../src/utils/campaignSessions'

function createSession(id: string, date: string): SessionSummary {
  return {
    id,
    campaignId: 'campaign-1',
    date,
    name: null,
    description: null,
    createdAt: null,
    updatedAt: null,
  }
}

describe('campaign session date helpers', () => {
  it('builds a Monday-first stable six-week calendar without UTC shifts', () => {
    const grid = getCampaignSessionCalendarGrid(2026, 7)

    expect(grid).toHaveLength(42)
    expect(grid[0]).toEqual({ date: '2026-07-27', dayOfMonth: 27, isCurrentMonth: false })
    expect(grid[4]).toEqual({ date: '2026-07-31', dayOfMonth: 31, isCurrentMonth: false })
    expect(grid[5]).toEqual({ date: '2026-08-01', dayOfMonth: 1, isCurrentMonth: true })
    expect(formatCampaignSessionDateKey(2026, 8, 27)).toBe('2026-08-27')
    expect(getCampaignSessionTodayKey(new Date(2026, 7, 27, 23))).toBe('2026-08-27')
  })

  it('rejects malformed and impossible calendar dates', () => {
    expect(parseCampaignSessionDate('2026-02-30')).toBeNull()
    expect(parseCampaignSessionDate('not-a-date')).toBeNull()
  })

  it('classifies dates relative to an explicit day', () => {
    expect(getCampaignSessionDateStatus('2026-08-27', '2026-08-27')).toBe('today')
    expect(getCampaignSessionDateStatus('2026-08-28', '2026-08-27')).toBe('upcoming')
    expect(getCampaignSessionDateStatus('2026-08-26', '2026-08-27')).toBe('past')
  })

  it('sorts descending by date and keeps same-date ordering deterministic', () => {
    const sessions = [
      createSession('a', '2026-08-27'),
      createSession('c', '2026-08-28'),
      createSession('b', '2026-08-27'),
    ]

    expect(sortCampaignSessionsByDate(sessions).map((session) => session.id)).toEqual([
      'c',
      'b',
      'a',
    ])
  })

  it('filters today with upcoming sessions and excludes it from past sessions', () => {
    const sessions = [
      createSession('past', '2026-08-26'),
      createSession('today', '2026-08-27'),
      createSession('future', '2026-08-28'),
    ]

    expect(filterCampaignSessions(sessions, 'upcoming', '2026-08-27').map((session) => session.id)).toEqual([
      'today',
      'future',
    ])
    expect(filterCampaignSessions(sessions, 'past', '2026-08-27').map((session) => session.id)).toEqual([
      'past',
    ])
  })
})