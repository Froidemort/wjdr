type RealtimeBinding = {
  table: string;
  filter?: string;
};

type UseRealtimeSyncOptions = {
  debounceMs: number;
  onUpdate: () => void | Promise<void>;
};

type RealtimeSyncController = {
  start: (channelName: string, bindings: RealtimeBinding[]) => void;
  stop: () => void;
};

export function useRealtimeSync(_options: UseRealtimeSyncOptions): RealtimeSyncController {
  return {
    start: (_channelName: string, _bindings: RealtimeBinding[]) => {
      // Storybook mock: disable Supabase realtime subscriptions.
    },
    stop: () => {
      // Storybook mock: nothing to stop.
    },
  };
}
