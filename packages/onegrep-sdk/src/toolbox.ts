import { clientFromConfig, OneGrepApiClient } from './client.js'
import { createConnectedClient, ConnectedClient } from './mcp/gateway/client.js'
import { ToolResource, toolResourcesFromClient } from './resource.js'
import { log } from '@repo/utils'

export interface ToolFilter {
  (resource: ToolResource): boolean
}

export const ServerNameFilter = (serverName: string): ToolFilter => {
  return (resource: ToolResource): boolean => {
    return resource.serverName() === serverName
  }
}

export const ToolNameFilter = (toolName: string): ToolFilter => {
  return (resource: ToolResource): boolean => {
    return resource.toolName() === toolName
  }
}

export const AndFilter = (...filters: ToolFilter[]): ToolFilter => {
  return (resource: ToolResource): boolean => {
    return filters.every((filter) => filter(resource))
  }
}

export class Toolbox {
  apiClient: OneGrepApiClient
  metaServerClient: ConnectedClient
  hostServerClientMap: Map<string, ConnectedClient>

  constructor(
    apiClient: OneGrepApiClient,
    metaServerClient: ConnectedClient,
    hostServerClientMap: Map<string, ConnectedClient>
  ) {
    this.apiClient = apiClient
    this.metaServerClient = metaServerClient
    this.hostServerClientMap = hostServerClientMap
  }

  async cleanup(): Promise<void> {
    const allClients = Array.from(this.hostServerClientMap.values())
    allClients.push(this.metaServerClient)
    await Promise.all(allClients.map(({ cleanup }) => cleanup()))
  }

  async getToolResources(): Promise<ToolResource[]> {
    const allToolResources: ToolResource[] = []

    const metaServerResources = await toolResourcesFromClient(
      this.metaServerClient
    )
    log.debug(`Meta server resources count: ${metaServerResources.length}`)
    allToolResources.push(...metaServerResources)

    const toolResourcesMap = new Map<string, ToolResource[]>()
    await Promise.all(
      Array.from(this.hostServerClientMap.entries()).map(
        async ([name, hostServerClient]) => {
          const resources = await toolResourcesFromClient(hostServerClient)
          toolResourcesMap.set(name, resources)
        }
      )
    )
    toolResourcesMap.forEach((resources, name) => {
      log.debug(`Server: ${name}, Resource Count: ${resources.length}`)
    })

    toolResourcesMap.forEach((resources) => {
      allToolResources.push(...resources)
    })
    log.debug(`All tool resources count: ${allToolResources.length}`)
    return allToolResources
  }

  async filterToolResources(toolFilter: ToolFilter): Promise<ToolResource[]> {
    const toolResources = await this.getToolResources()
    return toolResources.filter(toolFilter)
  }

  async matchUniqueToolResource(toolFilter: ToolFilter): Promise<ToolResource> {
    const filteredToolResources = await this.filterToolResources(toolFilter)
    if (filteredToolResources.length === 0) {
      throw new Error('No tool resource found')
    }
    if (filteredToolResources.length > 1) {
      throw new Error('Multiple tool resources found')
    }
    return filteredToolResources[0] as ToolResource
  }
}

export async function createToolbox(apiClient: OneGrepApiClient) {
  const metaClientConfig =
    await apiClient.get_meta_client_api_v1_clients_meta_get()
  const metaServerClient = await createConnectedClient(metaClientConfig)
  if (!metaServerClient) {
    throw new Error('Failed to create meta server client')
  }

  const hostClientConfigs =
    await apiClient.get_hosts_clients_api_v1_clients_hosts_get()
  const hostServerClientMap = new Map<string, ConnectedClient>()
  for (const hostClientConfig of hostClientConfigs) {
    const connectedClient = await createConnectedClient(hostClientConfig)
    if (connectedClient) {
      hostServerClientMap.set(hostClientConfig.name, connectedClient)
    }
  }

  return new Toolbox(apiClient, metaServerClient, hostServerClientMap)
}

export async function getToolbox(): Promise<Toolbox> {
  return await createToolbox(clientFromConfig())
}
