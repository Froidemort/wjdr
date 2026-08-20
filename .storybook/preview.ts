import type { Preview } from "@storybook/vue3";
import { setup } from '@storybook/vue3';
import { createPinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';

import "../src/assets/css/theme.css";

// 1. Installation globale de Pinia et du Router
setup((app) => {
  const pinia = createPinia();
  const router = createRouter({
    history: createMemoryHistory(), // Utilise MemoryHistory pour Storybook
    routes: [{ path: '/', component: { template: '<div />' } }],
  });

  app.use(pinia);
  app.use(router);
});

const preview: Preview = {
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