import { clientFromConfig, OneGrepApiClient } from './core/api/client.js'
import { BaseToolbox, ToolCache, ToolResource } from './types.js'
import { MCPToolCache } from './mcp/toolcache.js'
import { BlaxelToolCache } from 'blaxel/toolcache.js'

export interface ToolFilter {
  (resource: ToolResource): boolean
}

export const ServerNameFilter = (serverName: string): ToolFilter => {
  return (resource: ToolResource): boolean => {
    return resource.metadata.integrationName === serverName
  }
}

export const ToolNameFilter = (toolName: string): ToolFilter => {
  return (resource: ToolResource): boolean => {
    return resource.metadata.name === toolName
  }
}

export const AndFilter = (...filters: ToolFilter[]): ToolFilter => {
  return (resource: ToolResource): boolean => {
    return filters.every((filter) => filter(resource))
  }
}

export class Toolbox implements BaseToolbox<ToolResource> {
  apiClient: OneGrepApiClient
  toolCache: ToolCache

  constructor(apiClient: OneGrepApiClient, toolCache: ToolCache) {
    this.apiClient = apiClient
    this.toolCache = toolCache
  }

  async listAll(): Promise<ToolResource[]> {
    return this.toolCache.list()
  }

  async filter(toolFilter: ToolFilter): Promise<ToolResource[]> {
    const toolResources = await this.listAll()
    return toolResources.filter(toolFilter)
  }

  async matchUnique(toolFilter: ToolFilter): Promise<ToolResource> {
    const filteredToolResources = await this.filter(toolFilter)
    if (filteredToolResources.length === 0) {
      throw new Error('No tool resource found')
    }
    if (filteredToolResources.length > 1) {
      throw new Error('Multiple tool resources found')
    }
    return filteredToolResources[0] as ToolResource
  }

  async refresh(): Promise<boolean> {
    return this.toolCache.refresh()
  }

  async refreshIntegration(integrationName: string): Promise<boolean> {
    return this.toolCache.refreshIntegration(integrationName)
  }

  async close(): Promise<void> {
    await this.toolCache.cleanup()
    // await this.connectedClientManager.close()
  }
}

export async function createToolbox(apiClient: OneGrepApiClient) {
  // TODO: Get infra parameters from the API to determine which ToolCache to initialize
  // TODO: this will be populated from an api endpoint.
  const providerConfig = {
    providerName: 'blaxel'
  }

  let toolCache: ToolCache | undefined

  switch (providerConfig.providerName) {
    case 'mcp':
      toolCache = new MCPToolCache(apiClient)
      break
    case 'blaxel':
      toolCache = new BlaxelToolCache(apiClient)
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
