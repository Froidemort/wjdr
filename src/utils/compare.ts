export function compareFr(a: string, b: string): number {
  return a.localeCompare(b, 'fr')
}

export function compareByName<T extends { name: string }>(a: T, b: T): number {
  return compareFr(a.name, b.name)
}
