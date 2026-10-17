---
name: pinia-dexie-offline
description: Offline-first sync with Dexie and Pinia. Use when touching offline queue, local cache, realtime sync, optimistic updates.
---
# Offline-first sync

## When
Touching offline queue, local cache, realtime sync, optimistic updates.

## Rules
- Local schema in `src/db`; queue in the offline queue repository.
- Write: apply optimistically, enqueue, flush when online.
- Read: network first, fall back to Dexie.
- Flush logic in `useOfflineQueueSync`; realtime in `useRealtimeSync`.
- Dexie version bump with every schema change.

## Tools
- `graphify` (`get_node`, `get_neighbors`) on `useOfflineQueueSync` and queue repository before changes.
- `context7` for Dexie 4 docs.

## Verify
Tests with `fake-indexeddb`; `npm run test:unit`.
