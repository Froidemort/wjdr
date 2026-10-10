---
name: pinia-dexie-offline
description: Offline-first sync with Dexie and Pinia. Use when touching offline queue, local cache, realtime sync, optimistic updates.
---
- Local schema in `src/db`; queue in offline queue repository.
- Write: apply optimistically, enqueue, flush when online.
- Read: network first, fall back to Dexie.
- Flush logic in `useOfflineQueueSync`; realtime in `useRealtimeSync`.
- Test with `fake-indexeddb`.
