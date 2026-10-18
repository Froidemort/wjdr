import { normalizeSearchText } from './searchText'

export function slugify(value: string): string {
  return normalizeSearchText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
