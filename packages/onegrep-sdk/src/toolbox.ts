import { clientFromConfig, OneGrepApiClient } from './core/api/client.js'
import {
  BaseToolbox,
  ToolCache,
  EquippedTool,
  ToolMetadata,
  ToolFilter,
  ToolId,
  ScoredResult
} from './types.js'
import { UniversalToolCache } from './toolcache.js'

export const ServerNameFilter = (serverName: string): ToolFilter => {
  return (metadata: ToolMetadata): boolean => {
    return metadata.integrationName === serverName
  }
}

export const ToolNameFilter = (toolName: string): ToolFilter => {
  return (metadata: ToolMetadata): boolean => {
    return metadata.name === toolName
  }
}

export const AndFilter = (...filters: ToolFilter[]): ToolFilter => {
  return (metadata: ToolMetadata): boolean => {
    return filters.every((filter) => filter(metadata))
  }
}

export class Toolbox implements BaseToolbox<EquippedTool> {
  apiClient: OneGrepApiClient
  toolCache: ToolCache

  constructor(apiClient: OneGrepApiClient, toolCache: ToolCache) {
    this.apiClient = apiClient
    this.toolCache = toolCache
  }

  async refresh(): Promise<boolean> {
    return this.toolCache.refresh()
  }

  async metadata(toolFilter?: ToolFilter): Promise<Map<ToolId, ToolMetadata>> {
    return this.toolCache.metadata(toolFilter)
  }

  async get(toolId: ToolId): Promise<EquippedTool> {
    return this.toolCache.get(toolId)
  }

  async search(query: string): Promise<Array<ScoredResult<EquippedTool>>> {
    return this.toolCache.search(query)
  }

  async close(): Promise<void> {
    await this.toolCache.cleanup()
  }
}

export async function createToolbox(apiClient: OneGrepApiClient) {
  // TODO: Get infra parameters from the API to determine which ToolCache to initialize
  // TODO: this will be populated from an api endpoint.
  const providerConfig = {
    providerName: 'universal'
  }

  let toolCache: ToolCache | undefined

  switch (providerConfig.providerName) {
    // ! Deprecate fully when ready
    // case 'mcp':
    //   toolCache = new MCPToolCache(apiClient)
    //   break
    // case 'blaxel':
    //   toolCache = new BlaxelToolCache(apiClient)
    //   break
    case 'universal':
      toolCache = new UniversalToolCache(apiClient)
      break
    default:
      throw new Error(`Unsupported provider: ${providerConfig.providerName}`)
  }

  const ok = await toolCache!.refresh()

  if (!ok) {
    throw new Error('Toolcache initialization failed')
  }

  return new Toolbox(apiClient, toolCache)
}

export async function getToolbox(): Promise<Toolbox> {
  return await createToolbox(clientFromConfig())
}
