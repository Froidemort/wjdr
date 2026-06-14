import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup/indexeddb.ts'],
    include: ['tests/unit/**/*.test.ts']
  }
})
