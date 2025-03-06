import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  './packages/n8n-nodes-onegrep/vitest.config.ts',
  './packages/onegrep-api-client/vitest.config.ts',
  './packages/onegrep-sdk-langchain/vitest.config.ts',
  './packages/onegrep-sdk/vitest.config.ts'
])
