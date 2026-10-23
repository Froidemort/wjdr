export function throwIfError(error: unknown): asserts error is null | undefined {
  if (error) {
    throw error
  }
}
