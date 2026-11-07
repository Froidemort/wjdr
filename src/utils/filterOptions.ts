export function unavailableFilterValues(selected: Iterable<string>, available: Iterable<string>): string[] {
  const availableValues = new Set(available)
  return [...selected].filter((value) => !availableValues.has(value))
}
