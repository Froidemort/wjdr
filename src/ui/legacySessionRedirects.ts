export const LEGACY_SESSIONS_INDEX_REDIRECT = '/campaigns'

export function buildLegacySessionDetailRedirect(id: unknown): string {
  return `/campaigns/${String(id ?? '')}`
}

export function buildLegacySessionTimelineRedirect(
  campaignId: unknown,
  sessionEntryId: unknown
): string {
  return `/campaigns/${String(campaignId ?? '')}/timeline/${String(sessionEntryId ?? '')}`
}
