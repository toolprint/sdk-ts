import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  './packages/toolprint-sdk/vitest.config.ts',
  './packages/toolprint-api-client/vitest.config.ts',
  './packages/utils/vitest.config.ts'
])
