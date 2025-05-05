import { clientFromConfig, OneGrepApiClient } from '~/core/index.js'
import {
  BaseToolbox,
  ToolCache,
  FilterOptions,
  ToolId,
  ScoredResult,
  ToolDetails,
  BasicToolDetails
} from '~/types.js'
import { createToolCache } from '~/toolcache.js'

import { log } from '~/core/log.js'
import { getDopplerSecretManager } from './secrets/doppler.js'

export class Toolbox implements BaseToolbox<ToolDetails> {
  apiClient: OneGrepApiClient
  toolCache: ToolCache

  constructor(apiClient: OneGrepApiClient, toolCache: ToolCache) {
    this.apiClient = apiClient
    this.toolCache = toolCache
  }

  async listTools(): Promise<Map<ToolId, BasicToolDetails>> {
    return this.toolCache.listTools()
  }

  async listIntegrations(): Promise<string[]> {
    return this.toolCache.listIntegrations()
  }

  async filterTools(
    options?: FilterOptions
  ): Promise<Map<ToolId, ToolDetails>> {
    return this.toolCache.filterTools(options)
  }

  async get(toolId: ToolId): Promise<ToolDetails> {
    return this.toolCache.get(toolId)
  }

  async search(query: string): Promise<Array<ScoredResult<ToolDetails>>> {
    return this.toolCache.search(query)
  }

  async refresh(): Promise<boolean> {
    return this.toolCache.refresh()
  }

  async close(): Promise<void> {
    await this.toolCache.cleanup()
  }
}

export async function createToolbox(apiClient: OneGrepApiClient) {
  const secretManager = await getDopplerSecretManager()
  await secretManager.initialize()
  // Sync the process environment before initializing the tool cache.
  await secretManager.syncProcessEnvironment()

  const toolCache: ToolCache = await createToolCache(apiClient)

  // Make sure the tool cache is initialized on bootstrap
  const ok = await toolCache.refresh()

  if (!ok) {
    log.error('Toolcache initialization failed. Tools will not be available.')
  }

  return new Toolbox(apiClient, toolCache)
}

export async function getToolbox(): Promise<Toolbox> {
  return await createToolbox(clientFromConfig())
}
