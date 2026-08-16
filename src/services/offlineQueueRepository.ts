import Dexie, { type Table } from 'dexie'
import { customAlphabet } from 'nanoid'

export type OfflineEntityType = 'character' | 'session'

export interface QueuedUpdate {
  id: string
  entityType: OfflineEntityType
  entityId: string
  payload: Record<string, unknown>
  timestamp: number
  retryCount: number
  baseUpdatedAt: string | null
  localUpdatedAt: number | null
}

interface QueueDb extends Dexie {
  updates: Table<QueuedUpdate, string>
}

const generateId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 16)

const db = new Dexie('wjdr-offline-queue') as QueueDb

const queueChangeEvent = new EventTarget()

db.version(1).stores({
  updates: '&id, [entityType+entityId], timestamp',
})

function notifyQueueChange(): void {
  queueChangeEvent.dispatchEvent(new Event('change'))
}

export function subscribeOfflineQueueChanges(listener: () => void): () => void {
  const wrappedListener = () => listener()
  queueChangeEvent.addEventListener('change', wrappedListener)

  return () => {
    queueChangeEvent.removeEventListener('change', wrappedListener)
  }
}

function mergePayload(
  existingPayload: Record<string, unknown>,
  nextPayload: Record<string, unknown>
): Record<string, unknown> {
  const existingPatch = existingPayload.patch
  const nextPatch = nextPayload.patch

  if (
    existingPatch &&
    nextPatch &&
    typeof existingPatch === 'object' &&
    typeof nextPatch === 'object' &&
    !Array.isArray(existingPatch) &&
    !Array.isArray(nextPatch)
  ) {
    return {
      ...existingPayload,
      ...nextPayload,
      patch: {
        ...(existingPatch as Record<string, unknown>),
        ...(nextPatch as Record<string, unknown>),
      },
    }
  }

  return {
    ...existingPayload,
    ...nextPayload,
  }
}

export async function enqueueOfflineUpdate(input: {
  entityType: OfflineEntityType
  entityId: string
  payload: Record<string, unknown>
  baseUpdatedAt?: string | null
  localUpdatedAt?: number | null
}): Promise<string> {
  const now = Date.now()
  const baseUpdatedAt = input.baseUpdatedAt ?? null
  const localUpdatedAt = input.localUpdatedAt ?? now

  const existing = await db.updates
    .where('[entityType+entityId]')
    .equals([input.entityType, input.entityId])
    .last()

  if (existing) {
    await db.updates.update(existing.id, {
      payload: mergePayload(existing.payload, input.payload),
      timestamp: now,
      localUpdatedAt,
      baseUpdatedAt: baseUpdatedAt ?? existing.baseUpdatedAt,
    })
    notifyQueueChange()

    return existing.id
  }

  const id = generateId()
  await db.updates.add({
    id,
    entityType: input.entityType,
    entityId: input.entityId,
    payload: input.payload,
    timestamp: now,
    retryCount: 0,
    baseUpdatedAt,
    localUpdatedAt,
  })
  notifyQueueChange()

  return id
}

export async function listQueuedUpdates(): Promise<QueuedUpdate[]> {
  return db.updates.orderBy('timestamp').toArray()
}

export async function countQueuedUpdates(): Promise<number> {
  return db.updates.count()
}

export async function removeQueuedUpdate(id: string): Promise<void> {
  await db.updates.delete(id)
  notifyQueueChange()
}

export async function incrementQueuedRetry(id: string): Promise<void> {
  const current = await db.updates.get(id)
  if (!current) {
    return
  }

  await db.updates.update(id, { retryCount: current.retryCount + 1 })
}

export async function clearQueuedUpdates(): Promise<void> {
  await db.updates.clear()
  notifyQueueChange()
}
