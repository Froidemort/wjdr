import { describe, expect, it, vi } from 'vitest'

vi.mock('../../src/views/HomeView.vue', () => ({ default: {} }))

import { appRoutes } from '../../src/router/routes'

describe('application routes', () => {
  it('defines public, protected, and splash-skipping destinations', () => {
    const home = appRoutes.find((route) => route.path === '/')
    const characters = appRoutes.find((route) => route.path === '/characters')
    const resetPassword = appRoutes.find((route) => route.name === 'reset-password')
    const notFound = appRoutes.find((route) => route.name === 'not-found')

    expect(home?.meta).toMatchObject({ requiresAuth: false, hideFooter: false })
    expect(characters?.meta).toMatchObject({ requiresAuth: true, navSection: 'characters' })
    expect(resetPassword?.meta).toMatchObject({ requiresAuth: false, hideFooter: true, skipSplash: true })
    expect(notFound).toMatchObject({ path: '/:pathMatch(.*)*', meta: { skipSplash: true } })
  })

  it('maps legacy session URLs to their campaign equivalents', () => {
    const sessions = appRoutes.find((route) => route.path === '/sessions')
    const detail = appRoutes.find((route) => route.path === '/sessions/:id')
    const timeline = appRoutes.find((route) => route.path === '/sessions/:campaignId/timeline/:sessionEntryId')

    expect(sessions?.redirect).toBe('/campaigns')
    expect((detail?.redirect as (to: { params: { id: string } }) => string)({ params: { id: 'c-42' } })).toBe('/campaigns/c-42')
    expect((timeline?.redirect as (to: { params: { campaignId: string; sessionEntryId: string } }) => string)({ params: { campaignId: 'c-42', sessionEntryId: 's-07' } })).toBe('/campaigns/c-42/timeline/s-07')
  })
})