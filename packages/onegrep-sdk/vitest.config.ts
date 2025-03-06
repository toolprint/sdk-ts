import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  test: {
    typecheck: {
      tsconfig: 'tsconfig.check.json'
    },
    clearMocks: true,
    globals: true,
    setupFiles: ['dotenv/config'],
    testTimeout: 30000
  },
  resolve: {
    conditions: ['source'],
    mainFields: ['source', 'module', 'main'],
    alias: [
      { find: '~', replacement: resolve(__dirname, 'src') },
      {
        find: '@onegrep/json-schema-to-zod',
        replacement: resolve(
          __dirname,
          'node_modules/@onegrep/json-schema-to-zod'
        )
      }
    ]
  }
})
