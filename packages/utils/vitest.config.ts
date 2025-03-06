import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: '.',
  test: {
    typecheck: {
      tsconfig: 'tsconfig.json',
      include: ['test/**/*.ts']
    },
    clearMocks: true,
    globals: true,
    setupFiles: ['dotenv/config']
  },
  resolve: {
    alias: []
  }
})
