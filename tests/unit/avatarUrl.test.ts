import { describe, expect, it } from 'vitest'
import { sanitizeAvatarUrl } from '../../src/utils/avatarUrl'

const origin = 'https://abc.supabase.co'

describe('sanitizeAvatarUrl', () => {
  it('accepts https supabase storage urls', () => {
    const url = `${origin}/storage/v1/object/public/avatars/u/a.png`
    expect(sanitizeAvatarUrl(url, origin)).toBe(url)
  })

  it.each([
    'http://abc.supabase.co/storage/v1/object/public/a.png',
    'https://evil.example/storage/v1/object/public/a.png',
    'https://abc.supabase.co.evil.example/storage/v1/a.png',
    'https://abc.supabase.co/other/a.png',
    'javascript:alert(1)',
    'data:image/png;base64,AAAA',
    'not a url',
    '',
  ])('rejects %s', (value) => {
    expect(sanitizeAvatarUrl(value, origin)).toBeNull()
  })

  it('rejects nullish values and missing origin', () => {
    expect(sanitizeAvatarUrl(null, origin)).toBeNull()
    expect(sanitizeAvatarUrl(undefined, origin)).toBeNull()
    expect(sanitizeAvatarUrl(`${origin}/storage/v1/a.png`, null)).toBeNull()
  })
})
