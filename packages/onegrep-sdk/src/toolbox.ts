import { clientFromConfig, OneGrepApiClient } from './client.js'
import { ConnectedClientManager } from './mcp/client.js'
import { BaseToolbox, ToolCache, ToolResource } from './types.js'
import { MCPToolCache } from './mcp/toolcache.js'

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
  connectedClientManager: ConnectedClientManager
  toolCache: ToolCache

  constructor(
    apiClient: OneGrepApiClient,
    connectedClientManager: ConnectedClientManager,
    toolCache: ToolCache
  ) {
    this.apiClient = apiClient
    this.connectedClientManager = connectedClientManager
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

  async close(): Promise<void> {
    await this.connectedClientManager.close()
  }
}

export async function createToolbox(apiClient: OneGrepApiClient) {
  // Initialize the connected client manager for all clients
  const connectedClientManager = new ConnectedClientManager()
  const toolCache = new MCPToolCache(apiClient, connectedClientManager)
  const ok = await toolCache.refresh()
  if (!ok) {
    throw new Error('Toolcache initialization failed')
  }

  return new Toolbox(apiClient, connectedClientManager, toolCache)
}

export async function getToolbox(): Promise<Toolbox> {
  return await createToolbox(clientFromConfig())
}
