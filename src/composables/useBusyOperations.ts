import { ref } from 'vue'

export function useBusyOperations() {
  const busyIds = ref<Set<string>>(new Set())

  function isBusy(id: string): boolean {
    return busyIds.value.has(id)
  }

  function setBusy(id: string): void {
    busyIds.value.add(id)
    busyIds.value = new Set(busyIds.value)
  }

  function clearBusy(id: string): void {
    busyIds.value.delete(id)
    busyIds.value = new Set(busyIds.value)
  }

  function clearAllBusy(): void {
    busyIds.value.clear()
    busyIds.value = new Set(busyIds.value)
  }

  return {
    busyIds,
    isBusy,
    setBusy,
    clearBusy,
    clearAllBusy,
  }
}
