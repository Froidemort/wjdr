/** Run `fn` while the app believes it is offline, then restore connectivity. */
export async function whileOffline(fn: () => Promise<void>): Promise<void> {
  window.dispatchEvent(new Event('offline'))
  try {
    await fn()
  } finally {
    window.dispatchEvent(new Event('online'))
  }
}
