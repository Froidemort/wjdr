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

  if (value === todayValue) {
    return 'today'
  }

  return value > todayValue ? 'upcoming' : 'past'
}

export function getNextCampaignSession(
  sessions: SessionSummary[],
  todayKey: string
): SessionSummary | null {
  const candidates = sessions
    .filter((sessionItem) => sessionItem.date >= todayKey)
    .sort((left, right) => left.date.localeCompare(right.date) || left.id.localeCompare(right.id))

  return candidates[0] ?? null
}

export function shouldLandOnSessionsTab(
  sessions: SessionSummary[],
  todayKey: string,
  isMj: boolean
): boolean {
  return !isMj && sessions.some((sessionItem) => sessionItem.date === todayKey)
}

export function getNextFreeCampaignSessionDate(
  sessions: SessionSummary[],
  todayKey: string
): string {
  const start = parseCampaignSessionDate(todayKey)
  if (!start) {
    return todayKey
  }

  const usedDates = new Set(sessions.map((sessionItem) => sessionItem.date))
  const candidate = new Date(start)
  let key = todayKey
  while (usedDates.has(key)) {
    candidate.setDate(candidate.getDate() + 1)
    key = formatCampaignSessionDateKey(
      candidate.getFullYear(),
      candidate.getMonth() + 1,
      candidate.getDate()
    )
  }

  return key
}

export function getCampaignSessionRelativeLabel(date: string, todayKey: string): string {
  const parsed = parseCampaignSessionDate(date)
  const today = parseCampaignSessionDate(todayKey)
  if (!parsed || !today) {
    return ''
  }

  // Both parsed at noon local time, so rounding absorbs DST shifts.
  const diffDays = Math.round((parsed.getTime() - today.getTime()) / 86_400_000)
  if (diffDays < 0) {
    return 'Passée'
  }
  if (diffDays === 0) {
    return "Aujourd'hui"
  }
  return diffDays === 1 ? 'Demain' : `Dans ${diffDays} jours`
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
