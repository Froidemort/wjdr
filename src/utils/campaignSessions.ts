import type { SessionSummary } from '../types/domain'

export type SessionDateStatus = 'today' | 'upcoming' | 'past'
export type SessionTimelineFilter = 'all' | 'upcoming' | 'past'

export interface CampaignCalendarDay {
  date: string
  dayOfMonth: number
  isCurrentMonth: boolean
}

export function formatCampaignSessionDateKey(year: number, month: number, day: number): string {
  const monthValue = String(month).padStart(2, '0')
  const dayValue = String(day).padStart(2, '0')
  return `${year}-${monthValue}-${dayValue}`
}

export function getCampaignSessionTodayKey(date = new Date()): string {
  return formatCampaignSessionDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

export function getCampaignSessionCalendarGrid(year: number, month: number): CampaignCalendarDay[] {
  const firstDay = new Date(year, month, 1, 12)
  const firstDayMondayIndex = (firstDay.getDay() + 6) % 7
  const gridStart = new Date(year, month, 1 - firstDayMondayIndex, 12)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    return {
      date: formatCampaignSessionDateKey(date.getFullYear(), date.getMonth() + 1, date.getDate()),
      dayOfMonth: date.getDate(),
      isCurrentMonth: date.getMonth() === month && date.getFullYear() === year,
    }
  })
}

export function parseCampaignSessionDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const parsed = new Date(`${value}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return formatCampaignSessionDateKey(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate()) === value
    ? parsed
    : null
}

export function getCampaignSessionDateStatus(
  value: string,
  todayValue = getCampaignSessionTodayKey()
): SessionDateStatus {
  const parsed = parseCampaignSessionDate(value)
  const today = parseCampaignSessionDate(todayValue)

  if (!parsed || !today) {
    return 'upcoming'
  }

  const parsedKey = parsed.toISOString().slice(0, 10)
  const todayKey = today.toISOString().slice(0, 10)
  if (parsedKey === todayKey) {
    return 'today'
  }

  return parsed > today ? 'upcoming' : 'past'
}

export function sortCampaignSessionsByDate(sessions: SessionSummary[]): SessionSummary[] {
  return [...sessions].sort((left, right) => {
    const dateOrder = right.date.localeCompare(left.date)
    return dateOrder || right.id.localeCompare(left.id)
  })
}

export function filterCampaignSessions(
  sessions: SessionSummary[],
  filter: SessionTimelineFilter,
  todayValue?: string
): SessionSummary[] {
  if (filter === 'all') {
    return sessions
  }

  return sessions.filter((sessionItem) => {
    const status = getCampaignSessionDateStatus(sessionItem.date, todayValue)
    return filter === 'upcoming' ? status !== 'past' : status === 'past'
  })
}