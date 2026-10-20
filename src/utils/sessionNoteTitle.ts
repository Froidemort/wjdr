import { getCampaignSessionTodayKey, parseCampaignSessionDate } from './campaignSessions'

const MAX_TITLE_LENGTH = 60

function stripMarkdownMarkers(line: string): string {
  return line
    .trim()
    .replace(/^(?:>\s*)+/, '')
    .replace(/^#{1,6}\s+/, '')
    .replace(/^(?:[-*+]|\d+[.)])\s+/, '')
    .replace(/^\[[ xX]\]\s+/, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|~~|\*|`)/g, '')
    .replace(/(^|\s)_+|_+(?=\s|$)/g, '$1')
    .trim()
}

function formatFallbackTitle(sessionDate: string | null | undefined): string {
  const parsed = parseCampaignSessionDate(sessionDate ?? '') ?? parseCampaignSessionDate(getCampaignSessionTodayKey())
  const day = String(parsed?.getDate() ?? 1).padStart(2, '0')
  const month = String((parsed?.getMonth() ?? 0) + 1).padStart(2, '0')
  return `Note du ${day}/${month}`
}

export function deriveNoteTitle(body: string, sessionDate?: string | null): string {
  for (const line of body.split(/\r?\n/)) {
    const title = stripMarkdownMarkers(line)
    if (!title) {
      continue
    }

    return title.length > MAX_TITLE_LENGTH
      ? `${title.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…`
      : title
  }

  return formatFallbackTitle(sessionDate)
}
