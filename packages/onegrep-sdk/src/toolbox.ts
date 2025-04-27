import { clientFromConfig, OneGrepApiClient } from './core/api/client.js'
import {
  BaseToolbox,
  ToolCache,
  EquippedTool,
  FilterOptions,
  ToolId,
  ScoredResult,
  ToolDetails,
  BasicToolDetails
} from './types.js'
import { UniversalToolCache } from './toolcache.js'

export class Toolbox implements BaseToolbox<EquippedTool> {
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

  async get(toolId: ToolId): Promise<EquippedTool> {
    return this.toolCache.get(toolId)
  }

  async search(query: string): Promise<Array<ScoredResult<EquippedTool>>> {
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
  const toolCache: ToolCache = new UniversalToolCache(apiClient)
  const ok = await toolCache!.refresh()

  if (!ok) {
    throw new Error('Toolcache initialization failed')
  }

  return new Toolbox(apiClient, toolCache)
}

export async function getToolbox(): Promise<Toolbox> {
  return await createToolbox(clientFromConfig())
}
