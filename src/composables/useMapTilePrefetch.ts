import { computed, onScopeDispose, ref } from 'vue'
import { MAP_MIN_ZOOM, MAP_PREFETCH_CONCURRENCY, MAP_PREFETCH_MAX_ZOOM } from '../config/map'
import { MapTilesAuthError } from '../services/mapTilesRepository'
import type { TileCoords } from '../utils/mapTileCache'
import { TileRequestError } from '../utils/mapTileCache'
import { useMapTileCache } from './useMapTileCache'

const MAX_CONSECUTIVE_FAILURES = 5

interface RunToken {
  cancelled: boolean
}

export interface MapPrefetchState {
  running: boolean
  done: number
  total: number
  failed: number
  message: string | null
}

function buildQueue(): TileCoords[] {
  const queue: TileCoords[] = []
  for (let z = MAP_MIN_ZOOM; z <= MAP_PREFETCH_MAX_ZOOM; z += 1) {
    const size = 2 ** z
    for (let x = 0; x < size; x += 1) {
      for (let y = 0; y < size; y += 1) {
        queue.push({ z, x, y })
      }
    }
  }
  return queue
}

/** Downloads the low-zoom tiles once; cached tiles are skipped, so it never costs egress twice. */
export function useMapTilePrefetch() {
  const cache = useMapTileCache()
  const running = ref(false)
  const done = ref(0)
  const total = ref(0)
  const failed = ref(0)
  const message = ref<string | null>(null)
  let currentRun: RunToken | null = null

  const state = computed<MapPrefetchState>(() => ({
    running: running.value,
    done: done.value,
    total: total.value,
    failed: failed.value,
    message: message.value,
  }))

  async function start(): Promise<void> {
    if (running.value) return

    const queue = buildQueue()
    const run: RunToken = { cancelled: false }
    currentRun = run
    running.value = true
    done.value = 0
    failed.value = 0
    total.value = queue.length
    message.value = null

    let next = 0
    let authFailed = false
    let aborted = false
    let consecutiveFailures = 0

    const stopped = (): boolean => run.cancelled || authFailed || aborted

    async function worker(): Promise<void> {
      while (!stopped() && next < queue.length) {
        const coords = queue[next]
        next += 1
        try {
          if (!(await cache.has(coords))) {
            await cache.getTile(coords)
          }
          if (run.cancelled) return
          done.value += 1
          consecutiveFailures = 0
        } catch (error) {
          if (run.cancelled) return
          if (error instanceof MapTilesAuthError) {
            authFailed = true
          } else {
            failed.value += 1
            done.value += 1
            consecutiveFailures += 1
            const fatal =
              error instanceof TypeError || (error instanceof TileRequestError && (error.status === 429 || error.status >= 500))
            if (fatal || consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
              aborted = true
            }
          }
        }
      }
    }

    await Promise.all(Array.from({ length: MAP_PREFETCH_CONCURRENCY }, worker))
    if (currentRun !== run) return
    currentRun = null
    running.value = false

    if (authFailed) {
      message.value = 'Connecte-toi pour précharger la carte.'
    } else if (run.cancelled) {
      message.value = 'Préchargement annulé.'
    } else if (aborted) {
      message.value = 'Préchargement interrompu (erreurs répétées). Relance pour réessayer.'
    } else if (failed.value > 0) {
      message.value = `${failed.value} tuile(s) n'ont pas pu être téléchargées. Relance pour réessayer.`
    } else {
      message.value = 'Carte préchargée.'
    }
  }

  function cancel(): void {
    if (!currentRun) return
    currentRun.cancelled = true
    currentRun = null
    running.value = false
    message.value = 'Préchargement annulé.'
  }

  onScopeDispose(cancel)

  return { state, start, cancel }
}
