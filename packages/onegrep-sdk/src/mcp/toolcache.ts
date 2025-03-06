import { OneGrepApiClient } from '../client.js'
import { ConnectedClientManager } from './client.js'
import { ToolCache, ToolId, ToolResource } from '../types.js'
import { MCPToolResource, toolResourceFromTool } from './resource.js'
import { log } from '@repo/utils'
import { RemoteClientConfig } from './types.js'
import { Tool } from '@modelcontextprotocol/sdk/types.js'

export class MCPToolCache implements ToolCache {
  private apiClient: OneGrepApiClient
  private connectedClientManager: ConnectedClientManager
  private allConfigs: RemoteClientConfig[] = []
  private resources: Map<ToolId, ToolResource> = new Map()
  private toolIdsPerIntegration: Map<string, Set<ToolId>> = new Map()

  constructor(
    apiClient: OneGrepApiClient,
    connectedClientManager: ConnectedClientManager
  ) {
    this.apiClient = apiClient
    this.connectedClientManager = connectedClientManager
  }

  private async getToolResourcesForIntegration(
    clientConfig: RemoteClientConfig
  ): Promise<MCPToolResource[]> {
    const connectedClient =
      await this.connectedClientManager.getClient(clientConfig)
    if (!connectedClient) {
      log.error(`No connected client found for ${clientConfig.name}`)
      return []
    }
    const tools: Tool[] = await connectedClient.listTools()
    return tools.map((tool) =>
      toolResourceFromTool(tool, clientConfig, this.connectedClientManager)
    )
  }

  private async refreshToolsPerIntegration(
    clientConfig: RemoteClientConfig
  ): Promise<void> {
    const resources = await this.getToolResourcesForIntegration(clientConfig)

    // Log removed and added tools
    const previousToolIds =
      this.toolIdsPerIntegration.get(clientConfig.name) ?? new Set<ToolId>()
    const newToolIds = new Set(resources.map((tool) => tool.id))
    const toRemoveToolIds = new Set(
      [...previousToolIds].filter((x) => !newToolIds.has(x))
    )
    log.warn(`Removing ${toRemoveToolIds.size} tools from ${clientConfig.name}`)
    const toAddToolIds = new Set(
      [...newToolIds].filter((x) => !previousToolIds.has(x))
    )
    log.info(`Adding ${toAddToolIds.size} tools to ${clientConfig.name}`)

    // Update to new tool ids
    this.toolIdsPerIntegration.set(clientConfig.name, newToolIds)

    // Update resources
    toRemoveToolIds.forEach((toolId) => {
      this.resources.delete(toolId)
    })
    resources.forEach((resource) => {
      this.resources.set(resource.id, resource)
    })
  }

  private async refreshToolsParallel(
    clientConfigs: RemoteClientConfig[]
  ): Promise<void> {
    await Promise.all(
      clientConfigs.map((config) => this.refreshToolsPerIntegration(config))
    )
  }

  async refresh(): Promise<boolean> {
    const pipeline = [
      this.refreshIntegrations.bind(this),
      this.refreshTools.bind(this)
    ]

    for (const step of pipeline) {
      const stepName = step.name
      log.debug(`Starting toolcache refresh step: ${stepName}`)

      try {
        if (!(await step())) {
          log.error(`Failed at step: ${stepName}, aborting toolcache refresh`)
          return false
        }
        log.debug(`Successfully completed step: ${stepName}`)
      } catch (e) {
        log.error(`Exception in ${stepName}`, e)
        return false
      }
    }

    log.info('Toolcache refresh completed successfully')
    return true
  }

  async refreshIntegrations(): Promise<boolean> {
    try {
      // TODO: Actually healthcheck
      // const isOk = this.apiClient.healthcheck()
      // if (!isOk) {
      //     this.logger.error('API Healthcheck failed: cannot initialize toolcache')
      //     return false
      // }

      log.debug('API Healthcheck passed')

      // TODO: Merge meta and host client configs
      const metaClientConfig =
        await this.apiClient.get_meta_client_api_v1_clients_meta_get()
      log.debug(`Meta client config: ${JSON.stringify(metaClientConfig)}`)

      const hostClientConfigs =
        await this.apiClient.get_hosts_clients_api_v1_clients_hosts_get()
      log.debug(`Host client configs: ${JSON.stringify(hostClientConfigs)}`)

      this.allConfigs = [metaClientConfig, ...hostClientConfigs]

      log.info(
        `Integrations refreshed, found ${this.allConfigs.length} integrations`
      )
      return true
    } catch (e) {
      log.error('Error refreshing integrations', e)
      return false
    }
  }

  async refreshTools(): Promise<boolean> {
    try {
      await this.refreshToolsParallel(this.allConfigs)
      log.info(`Tools refreshed, currently ${this.resources.size} total tools`)
      return true
    } catch (e) {
      log.error('Error refreshing tools', e)
      return false
    }
  }

  async get(key: ToolId): Promise<ToolResource | undefined> {
    return this.resources.get(key)
  }

  async list(): Promise<ToolResource[]> {
    return Array.from(this.resources.values())
  }
}
