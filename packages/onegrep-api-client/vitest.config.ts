import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  esbuild: {
    tsconfigRaw: '{}'
  },
  test: {
    include: ['test/**/*.test.ts'],
    clearMocks: true,
    globals: true,
    setupFiles: ['dotenv/config']
  },
  resolve: {
    alias: [{ find: '~', replacement: resolve(__dirname, 'src') }]
  }
})
