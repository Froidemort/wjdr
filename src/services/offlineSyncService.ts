import {
  incrementQueuedRetry,
  listQueuedUpdates,
  removeQueuedUpdate,
  type QueuedUpdate,
} from './offlineQueueRepository'
import { isTransientError } from './shared/networkErrors'
import { updateCharacterCore, updateCharacterStatValues } from './charactersRepository'
import { getSessionById, updateSession } from './sessionsRepository'

function mapCharacterCorePatch(
  patch: Record<string, unknown>
): Partial<{
  pv_max: number
  pv_current: number
  fortune_max: number
  fortune_current: number
  destiny_current: number
  xp_total: number
  xp_available: number
  insanity_points: number
  money_gold: number
  money_silver: number
  money_copper: number
}> {
  const mapped: Record<string, number> = {}

  if (typeof patch.pvMax === 'number') mapped.pv_max = patch.pvMax
  if (typeof patch.pvCurrent === 'number') mapped.pv_current = patch.pvCurrent
  if (typeof patch.fortuneMax === 'number') mapped.fortune_max = patch.fortuneMax
  if (typeof patch.fortuneCurrent === 'number') mapped.fortune_current = patch.fortuneCurrent
  if (typeof patch.destinyCurrent === 'number') mapped.destiny_current = patch.destinyCurrent
  if (typeof patch.xpTotal === 'number') mapped.xp_total = patch.xpTotal
  if (typeof patch.xpAvailable === 'number') mapped.xp_available = patch.xpAvailable
  if (typeof patch.insanityPoints === 'number') mapped.insanity_points = patch.insanityPoints
  if (typeof patch.moneyGold === 'number') mapped.money_gold = patch.moneyGold
  if (typeof patch.moneySilver === 'number') mapped.money_silver = patch.moneySilver
  if (typeof patch.moneyCopper === 'number') mapped.money_copper = patch.moneyCopper

  return mapped
}

async function applyCharacterUpdate(entry: QueuedUpdate): Promise<void> {
  const kind = String(entry.payload.kind ?? '')

  if (kind === 'character-core') {
    const patch = entry.payload.patch
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
      return
    }

    const mapped = mapCharacterCorePatch(patch as Record<string, unknown>)
    if (Object.keys(mapped).length === 0) {
      return
    }

    await updateCharacterCore(entry.entityId, mapped)
    return
  }

  if (kind === 'character-stat') {
    const statCode = entry.payload.statCode
    const patch = entry.payload.patch
    if (typeof statCode !== 'string' || !patch || typeof patch !== 'object' || Array.isArray(patch)) {
      return
    }

    const statPatch = patch as Record<string, unknown>
    await updateCharacterStatValues(entry.entityId, statCode, {
      current_advanced:
        typeof statPatch.currentAdvanced === 'number' ? statPatch.currentAdvanced : undefined,
      base_value: typeof statPatch.baseValue === 'number' ? statPatch.baseValue : undefined,
      total_advanced:
        typeof statPatch.totalAdvanced === 'number' ? statPatch.totalAdvanced : undefined,
    })
  }
}

function isLocalMoreRecent(localUpdatedAt: number | null, remoteUpdatedAt: string | null): boolean {
  if (localUpdatedAt == null || !remoteUpdatedAt) {
    return true
  }

  const remoteTs = new Date(remoteUpdatedAt).getTime()
  if (Number.isNaN(remoteTs)) {
    return true
  }

  return localUpdatedAt >= remoteTs
}

async function applySessionUpdate(entry: QueuedUpdate): Promise<void> {
  const kind = String(entry.payload.kind ?? '')
  if (kind !== 'session') {
    return
  }

  const patch = entry.payload.patch
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return
  }

  const session = await getSessionById(entry.entityId)
  if (!session) {
    throw new Error('Session introuvable.')
  }

  const baseUpdatedAt = entry.baseUpdatedAt
  const hasRemoteMutationSinceBase =
    Boolean(baseUpdatedAt && session.updatedAt) &&
    new Date(session.updatedAt as string).getTime() > new Date(baseUpdatedAt as string).getTime()

  if (hasRemoteMutationSinceBase && !isLocalMoreRecent(entry.localUpdatedAt, session.updatedAt)) {
    return
  }

  const source = patch as Record<string, unknown>
  await updateSession(entry.entityId, {
    date: typeof source.date === 'string' ? source.date : undefined,
    name: typeof source.name === 'string' || source.name === null ? (source.name as string | null) : undefined,
    description:
      typeof source.description === 'string' || source.description === null
        ? (source.description as string | null)
        : undefined,
  })
}

async function applyQueuedUpdate(entry: QueuedUpdate): Promise<void> {
  if (entry.entityType === 'character') {
    await applyCharacterUpdate(entry)
    return
  }

  if (entry.entityType === 'session') {
    await applySessionUpdate(entry)
  }
}

export async function replayOfflineQueue(options?: {
  onDropped?: (entry: QueuedUpdate, error: unknown) => void
  onApplied?: (entry: QueuedUpdate) => void
}): Promise<{ applied: number; dropped: number; pending: number }> {
  const entries = await listQueuedUpdates()
  let applied = 0
  let dropped = 0

  for (const entry of entries) {
    try {
      await applyQueuedUpdate(entry)
      await removeQueuedUpdate(entry.id)
      applied += 1
      options?.onApplied?.(entry)
    } catch (error) {
      if (isTransientError(error)) {
        await incrementQueuedRetry(entry.id)
        break
      }

      await removeQueuedUpdate(entry.id)
      dropped += 1
      options?.onDropped?.(entry, error)
    }
  }

  const pending = (await listQueuedUpdates()).length
  return { applied, dropped, pending }
}
