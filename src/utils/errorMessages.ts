export function safeErrorMessage(error: unknown, fallback = 'Modification impossible.'): string {
  const isBackendError = typeof error === 'object' && error !== null && 'code' in error
  if (error instanceof TypeError) {
    return 'Connexion indisponible.'
  }

  if (error instanceof Error && !isBackendError && error.message) {
    return error.message
  }

  return fallback
}
