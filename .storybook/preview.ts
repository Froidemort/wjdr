import type { Preview } from "@storybook/vue3";
import { setup } from "@storybook/vue3";
import { mswLoader } from "msw-storybook-addon/csf3";
import { createPinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import { supabase } from "../src/db/supabase";

import "../src/assets/css/theme.css";

const supabaseClient = supabase as unknown as {
  channel: (name: string) => {
    on: (...args: unknown[]) => unknown;
    subscribe: () => unknown;
  };
  removeChannel: (channel: unknown) => Promise<unknown>;
};

const createNoopRealtimeChannel = () => {
  const channel = {
    on: () => channel,
    subscribe: () => channel,
  };
  return channel;
};

supabaseClient.channel = (_name: string) => createNoopRealtimeChannel();
supabaseClient.removeChannel = async (_channel: unknown) => ({ status: "ok" });

// 1. Installation globale de Pinia et du Router
setup((app) => {
  const pinia = createPinia();
  const router = createRouter({
    history: createMemoryHistory(), // Utilise MemoryHistory pour Storybook
    routes: [{ path: "/", component: { template: "<div />" } }],
  });

  app.use(pinia);
  app.use(router);
});

const preview: Preview = {
  loaders: [mswLoader()],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
