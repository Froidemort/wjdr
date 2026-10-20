import { describe, expect, it } from 'vitest'
import type { SessionSummary } from '../../src/types/domain'
import {
  filterCampaignSessions,
  formatCampaignSessionDateKey,
  getCampaignSessionDateStatus,
  getCampaignSessionCalendarGrid,
  getCampaignSessionRelativeLabel,
  getCampaignSessionTodayKey,
  getNextCampaignSession,
  getNextFreeCampaignSessionDate,
  parseCampaignSessionDate,
  shouldLandOnSessionsTab,
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

  it('classifies by date key near midnight without UTC conversion', () => {
    expect(getCampaignSessionDateStatus('2026-03-29', '2026-03-29')).toBe('today')
    expect(getCampaignSessionDateStatus('2026-03-30', '2026-03-29')).toBe('upcoming')
    expect(getCampaignSessionDateStatus('2026-12-31', '2027-01-01')).toBe('past')
    expect(getCampaignSessionDateStatus('invalid', '2026-03-29')).toBe('upcoming')
  })
})

describe('getNextCampaignSession', () => {
  it('prefers a session dated today', () => {
    const sessions = [
      createSession('future', '2026-08-28'),
      createSession('today', '2026-08-27'),
      createSession('past', '2026-08-26'),
    ]

    expect(getNextCampaignSession(sessions, '2026-08-27')?.id).toBe('today')
  })

  it('returns the nearest upcoming session', () => {
    const sessions = [
      createSession('later', '2026-09-10'),
      createSession('near', '2026-08-30'),
      createSession('past', '2026-08-01'),
    ]

    expect(getNextCampaignSession(sessions, '2026-08-27')?.id).toBe('near')
  })

  it('returns null without upcoming sessions', () => {
    expect(getNextCampaignSession([createSession('past', '2026-08-01')], '2026-08-27')).toBeNull()
    expect(getNextCampaignSession([], '2026-08-27')).toBeNull()
  })

  it('does not mutate the input array', () => {
    const sessions = [createSession('b', '2026-09-01'), createSession('a', '2026-08-30')]
    getNextCampaignSession(sessions, '2026-08-27')

    expect(sessions.map((session) => session.id)).toEqual(['b', 'a'])
  })
})

describe('shouldLandOnSessionsTab', () => {
  const sessions = [createSession('past', '2026-08-26'), createSession('today', '2026-08-27')]

  it('lands players on sessions when a session is today', () => {
    expect(shouldLandOnSessionsTab(sessions, '2026-08-27', false)).toBe(true)
  })

  it('does not redirect the MJ', () => {
    expect(shouldLandOnSessionsTab(sessions, '2026-08-27', true)).toBe(false)
  })

  it('does not redirect without a session today', () => {
    expect(shouldLandOnSessionsTab(sessions, '2026-08-28', false)).toBe(false)
    expect(shouldLandOnSessionsTab([], '2026-08-27', false)).toBe(false)
  })
})

describe('getNextFreeCampaignSessionDate', () => {
  it('returns today when no session uses it', () => {
    const sessions = [createSession('past', '2026-08-26'), createSession('future', '2026-08-28')]

    expect(getNextFreeCampaignSessionDate(sessions, '2026-08-27')).toBe('2026-08-27')
  })

  it('skips consecutive used dates, including across month and year boundaries', () => {
    const sessions = [createSession('a', '2026-12-31'), createSession('b', '2027-01-01')]

    expect(getNextFreeCampaignSessionDate(sessions, '2026-12-31')).toBe('2027-01-02')
    expect(getNextFreeCampaignSessionDate([createSession('c', '2026-02-28')], '2026-02-28')).toBe('2026-03-01')
  })

  it('ignores past dates and returns an invalid today key unchanged', () => {
    expect(getNextFreeCampaignSessionDate([createSession('past', '2026-08-01')], '2026-08-27')).toBe('2026-08-27')
    expect(getNextFreeCampaignSessionDate([], 'invalid')).toBe('invalid')
  })
})

describe('getCampaignSessionRelativeLabel', () => {
  it('labels today, tomorrow, upcoming and past dates', () => {
    expect(getCampaignSessionRelativeLabel('2026-08-27', '2026-08-27')).toBe("Aujourd'hui")
    expect(getCampaignSessionRelativeLabel('2026-08-28', '2026-08-27')).toBe('Demain')
    expect(getCampaignSessionRelativeLabel('2026-08-30', '2026-08-27')).toBe('Dans 3 jours')
    expect(getCampaignSessionRelativeLabel('2026-08-26', '2026-08-27')).toBe('Passée')
  })

  it('counts days across DST changes and year boundaries', () => {
    expect(getCampaignSessionRelativeLabel('2026-03-30', '2026-03-28')).toBe('Dans 2 jours')
    expect(getCampaignSessionRelativeLabel('2026-10-26', '2026-10-24')).toBe('Dans 2 jours')
    expect(getCampaignSessionRelativeLabel('2027-01-01', '2026-12-31')).toBe('Demain')
  })

  it('returns an empty label for invalid dates', () => {
    expect(getCampaignSessionRelativeLabel('invalid', '2026-08-27')).toBe('')
  })
})
