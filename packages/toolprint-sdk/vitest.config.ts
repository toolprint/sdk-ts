import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  test: {
    typecheck: {
      tsconfig: 'tsconfig.json'
    },
    clearMocks: true,
    globals: true,
    setupFiles: ['dotenv/config'],
    testTimeout: 30000,
    include: ['test/**/*.test.ts', 'src/**/*.test.ts']
  },
  resolve: {
    conditions: ['source'],
    mainFields: ['source', 'module', 'main'],
    alias: [
      { find: '~', replacement: resolve(__dirname, 'src') },
      {
        find: '@toolprint/json-schema-to-zod',
        replacement: resolve(
          __dirname,
          'node_modules/@toolprint/json-schema-to-zod'
        )
      }
    ]
  }
})
