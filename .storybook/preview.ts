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

const themes = ["grimorium-dark", "grimorium-light"] as const;
type Theme = (typeof themes)[number];

// STORYBOOK_THEME lets vitest run the whole suite against the light theme.
const envTheme = import.meta.env.STORYBOOK_THEME as string | undefined;
const initialTheme: Theme = themes.find((t) => t === envTheme) ?? "grimorium-dark";

const preview: Preview = {
  loaders: [mswLoader()],
  initialGlobals: { theme: initialTheme },
  globalTypes: {
    theme: {
      description: "daisyUI theme",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [...themes],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (story, context) => {
      if (!document.getElementById("sb-no-motion")) {
        const style = document.createElement("style");
        style.id = "sb-no-motion";
        // Axe samples colours mid-animation otherwise (modal fade-in).
        style.textContent = "*,*::before,*::after{animation:none!important;transition:none!important}";
        document.head.append(style);
      }
      const theme = themes.find((t) => t === context.globals.theme) ?? initialTheme;
      document.documentElement.dataset.theme = theme;
      return story();
    },
  ],
  parameters: {
    a11y: { test: "error" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
