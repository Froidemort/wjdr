import { test as base, type BrowserContext, type Page, type Route } from '@playwright/test'

export const E2E_USER_ID = 'user-e2e'
export const E2E_CHARACTER_ID = 'char-e2e'
export const E2E_CAMPAIGN_ID = 'camp-e2e'

export interface RecordedRequest {
  method: string
  table: string
  query: URLSearchParams
  body: Record<string, unknown> | null
}

interface ArmorLink {
  id: string
  armor_id: string
  quality: string
  is_equipped: boolean
  armors: {
    id: string
    name: string
    description: string | null
    covered_locations: string[]
    encumbrance: number
    armor_points: number
  }
}

interface SessionRow {
  id: string
  campaign_id: string
  date: string
  name: string | null
  description: string | null
  created_at: string
  updated_at: string
}

interface SessionNoteRow {
  id: string
  campaign_id: string
  session_id: string | null
  author_user_id: string | null
  title: string
  content_text: string | null
  is_visible: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}

export class FakeBackend {
  readonly requests: RecordedRequest[] = []
  offline = false

  readonly character = {
    id: E2E_CHARACTER_ID,
    name: 'Ulrich Test',
    race: 'humain',
    gender: 'masculin',
    campaign_id: E2E_CAMPAIGN_ID,
    user_id: E2E_USER_ID,
    career_id: 'career-1',
    pv_current: 8,
    fortune_current: 2,
    fortune_max: 3,
    destiny_current: 1,
    destiny_max: 2,
    xp_total: 100,
    xp_available: 20,
    insanity_points: 0,
    money_gold: 1,
    money_silver: 2,
    money_copper: 3,
    career: { name: 'Soldat' },
  }

  readonly stats = [
    { stat_code: 'CC', base_value: 30, current_advanced: 0, total_advanced: 10 },
    { stat_code: 'CT', base_value: 30, current_advanced: 0, total_advanced: 10 },
    { stat_code: 'F', base_value: 30, current_advanced: 0, total_advanced: 10 },
    { stat_code: 'E', base_value: 30, current_advanced: 0, total_advanced: 10 },
    { stat_code: 'B', base_value: 12, current_advanced: 0, total_advanced: 0 },
  ]

  readonly staticStats = [
    { code: 'CC', is_secondary: false },
    { code: 'CT', is_secondary: false },
    { code: 'F', is_secondary: false },
    { code: 'E', is_secondary: false },
    { code: 'B', is_secondary: true },
  ]

  readonly armors: ArmorLink[] = [
    {
      id: 'link-armor-1',
      armor_id: 'armor-1',
      quality: 'normal',
      is_equipped: false,
      armors: {
        id: 'armor-1',
        name: 'Cotte de mailles',
        description: null,
        covered_locations: ['corps'],
        encumbrance: 100,
        armor_points: 2,
      },
    },
  ]

  readonly campaign = {
    id: E2E_CAMPAIGN_ID,
    name: 'Campagne Test',
    code: 'TESTCODE',
    description: null as string | null,
    is_archived: false,
    mj_id: 'mj-e2e-other',
    created_at: '2024-01-01T00:00:00.000Z',
  }

  readonly sessions: SessionRow[] = []
  readonly sessionNotes: SessionNoteRow[] = []
  private nextSessionId = 1
  private nextNoteId = 1

  patchesTo(table: string): RecordedRequest[] {
    return this.requests.filter((request) => request.method === 'PATCH' && request.table === table)
  }

  private rowsFor(table: string, query: URLSearchParams): unknown[] {
    const select = query.get('select') ?? ''
    switch (table) {
      case 'characters':
        return select.startsWith('campaign_id') ? [{ campaign_id: E2E_CAMPAIGN_ID }] : [this.character]
      case 'campaigns':
        return [this.campaign]
      case 'sessions':
        return [...this.sessions].sort((left, right) => right.date.localeCompare(left.date))
      case 'session_notes': {
        let rows = this.sessionNotes
        const sessionIdFilter = query.get('session_id')
        if (sessionIdFilter) {
          rows = rows.filter((row) => `eq.${row.session_id}` === sessionIdFilter)
        }
        if (query.get('is_visible') === 'eq.true') {
          rows = rows.filter((row) => row.is_visible)
        }
        return [...rows].sort((left, right) => right.created_at.localeCompare(left.created_at))
      }
      case 'character_stat_values':
        return query.has('stat_code')
          ? this.stats.filter((stat) => `eq.${stat.stat_code}` === query.get('stat_code'))
          : this.stats
      case 'static_stats':
        return this.staticStats
      case 'character_armors':
        return this.armors
      case 'profiles':
        return [{ full_name: 'Testeur', username: 'testeur', avatar_url: null }]
      default:
        return []
    }
  }

  private applyPatch(table: string, query: URLSearchParams, body: Record<string, unknown>): void {
    if (table === 'characters') {
      Object.assign(this.character, body)
    } else if (table === 'character_stat_values') {
      const code = query.get('stat_code')?.replace('eq.', '')
      Object.assign(this.stats.find((stat) => stat.stat_code === code) ?? {}, body)
    } else if (table === 'character_armors') {
      const id = query.get('id')?.replace('eq.', '')
      Object.assign(this.armors.find((armor) => armor.id === id) ?? {}, body)
    }
  }

  private applyInsert(table: string, body: Record<string, unknown>): Record<string, unknown> | null {
    const now = new Date().toISOString()
    if (table === 'sessions') {
      const row: SessionRow = {
        id: `session-${this.nextSessionId++}`,
        campaign_id: (body.campaign_id as string | undefined) ?? E2E_CAMPAIGN_ID,
        date: body.date as string,
        name: (body.name as string | null | undefined) ?? null,
        description: (body.description as string | null | undefined) ?? null,
        created_at: now,
        updated_at: now,
      }
      this.sessions.push(row)
      return row
    }
    if (table === 'session_notes') {
      const row: SessionNoteRow = {
        id: `note-${this.nextNoteId++}`,
        campaign_id: (body.campaign_id as string | undefined) ?? E2E_CAMPAIGN_ID,
        session_id: (body.session_id as string | null | undefined) ?? null,
        author_user_id: E2E_USER_ID,
        title: (body.title as string | undefined) ?? '',
        content_text: (body.content_text as string | null | undefined) ?? null,
        is_visible: Boolean(body.is_visible),
        is_archived: false,
        created_at: now,
        updated_at: now,
      }
      this.sessionNotes.push(row)
      return row
    }
    return null
  }

  async handleRest(route: Route): Promise<void> {
    if (this.offline) {
      await route.abort('internetdisconnected')
      return
    }

    const request = route.request()
    const url = new URL(request.url())
    const table = url.pathname.split('/rest/v1/')[1] ?? ''
    const method = request.method()
    const body = method === 'GET' ? null : (request.postDataJSON() as Record<string, unknown> | null)
    this.requests.push({ method, table, query: url.searchParams, body })

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204 })
      return
    }

    const wantsObject = (request.headers()['accept'] ?? '').includes('vnd.pgrst.object+json')

    if (method === 'POST' && body) {
      const created = this.applyInsert(table, body)
      if (created && wantsObject) {
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) })
        return
      }
      await route.fulfill({ status: 204 })
      return
    }

    if (method !== 'GET') {
      if (method === 'PATCH' && body) {
        this.applyPatch(table, url.searchParams, body)
      }
      await route.fulfill({ status: 204 })
      return
    }

    const rows = this.rowsFor(table, url.searchParams)
    if (wantsObject) {
      await route.fulfill(
        rows.length === 1
          ? { status: 200, contentType: 'application/json', body: JSON.stringify(rows[0]) }
          : { status: 406, contentType: 'application/json', body: JSON.stringify({ code: 'PGRST116', message: 'no rows', details: '', hint: null }) }
      )
      return
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rows) })
  }
}

function base64Url(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

function buildFakeSession(): string {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600
  const accessToken = [
    base64Url({ alg: 'none', typ: 'JWT' }),
    base64Url({ sub: E2E_USER_ID, role: 'authenticated', exp: expiresAt }),
    'e2e',
  ].join('.')

  return JSON.stringify({
    access_token: accessToken,
    refresh_token: 'e2e-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    user: {
      id: E2E_USER_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'e2e@example.test',
      app_metadata: {},
      user_metadata: { username: 'testeur' },
      created_at: '2024-01-01T00:00:00.000Z',
    },
  })
}

/** Serves a fake Supabase session without knowing the project URL or touching real credentials. */
async function installFakeSupabase(context: BrowserContext, page: Page, backend: FakeBackend): Promise<void> {
  const session = buildFakeSession()
  // supabase-js stores its session under `sb-<project>-auth-token`; answering for any such key avoids reading the URL.
  await context.addInitScript((fakeSession: string) => {
    const nativeGetItem = Storage.prototype.getItem
    Storage.prototype.getItem = function (key: string): string | null {
      if (/^sb-.+-auth-token$/.test(key)) {
        return fakeSession
      }
      return nativeGetItem.call(this, key)
    }
  }, session)

  await page.route('**/auth/v1/**', (route) => {
    if (backend.offline) {
      return route.abort('internetdisconnected')
    }
    const { pathname } = new URL(route.request().url())
    if (pathname.endsWith('/user')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(JSON.parse(session).user) })
    }
    return route.fulfill({ status: 204 })
  })
  await page.route('**/rest/v1/**', (route) => backend.handleRest(route))
}

/** Marks the splash as seen so it does not show (and race) in the test. */
export async function markSplashSeen(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('wjdr:splash-last-seen', String(Date.now()))
  })
}

export const test = base.extend<{ backend: FakeBackend }>({
  backend: [
    async ({ context, page }, use) => {
      const backend = new FakeBackend()
      await installFakeSupabase(context, page, backend)
      await use(backend)
    },
    { auto: true },
  ],
})

export { expect } from '@playwright/test'
