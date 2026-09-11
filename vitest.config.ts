import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof import.meta.dirname !== 'undefined' ? import.meta.dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      all: true,
      include: [
        'src/services/**/*.ts',
        'src/stores/**/*.ts',
        'src/composables/**/*.ts',
        'src/utils/**/*.ts',
        'src/router/**/*.ts',
        'src/server/**/*.ts',
      ],
      exclude: [
        'src/main.ts',
        'src/db/**',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
      },
    },
    projects: [{
      extends: true,
      test: {
        name: 'unit',
        globals: true,
        environment: 'node',
        setupFiles: ['./tests/setup/indexeddb.ts'],
        include: ['tests/unit/**/*.test.ts'],
      }
    },
    {
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});