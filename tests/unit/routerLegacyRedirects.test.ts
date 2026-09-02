import { describe, expect, it } from 'vitest'
import {
  buildLegacySessionDetailRedirect,
  buildLegacySessionTimelineRedirect,
  LEGACY_SESSIONS_INDEX_REDIRECT,
} from '../../src/router/legacySessionRedirects'

describe('legacy sessions routes redirects', () => {
  it('redirects /sessions to /campaigns', async () => {
    expect(LEGACY_SESSIONS_INDEX_REDIRECT).toBe('/campaigns')
  })

  it('redirects /sessions/:id to /campaigns/:id', async () => {
    expect(buildLegacySessionDetailRedirect('campaign-42')).toBe('/campaigns/campaign-42')
  })

  it('redirects timeline legacy route to campaign timeline route', async () => {
    expect(buildLegacySessionTimelineRedirect('c-01', 's-77')).toBe('/campaigns/c-01/timeline/s-77')
  })
})

