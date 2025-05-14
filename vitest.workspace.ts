import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  './packages/onegrep-api-client/vitest.config.ts',
  './packages/utils/vitest.config.ts',
  './packages/n8n-nodes-onegrep/vitest.config.ts',
  './packages/onegrep-sdk/vitest.config.ts'
])
