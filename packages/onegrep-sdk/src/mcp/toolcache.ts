import { OneGrepApiClient } from '../core/api/client.js'
import { ConnectedClientManager } from './client.js'
import { ToolCache, ApiToolResource, ToolId, ToolResource } from '../types.js'
import { MCPToolResource, toolResourceFromMcpTool } from './resource.js'
import { log } from '@repo/utils'
import { RemoteClientConfig } from './types.js'
import { Tool as MCPTool, Tool } from '@modelcontextprotocol/sdk/types.js'
import { getUnixTime } from 'date-fns'

class IntegrationRefreshAttempt {
  constructor(
    public readonly success: boolean,
    public readonly integrationName: string,
    public readonly error?: any,
    public readonly refreshTs: number = getUnixTime(Date.now())
  ) {}
}

export class MCPToolCache implements ToolCache {
  private apiClient: OneGrepApiClient
  private connectedClientManager: ConnectedClientManager
  private allConfigs: Array<RemoteClientConfig> = []
  private toolIdToResource: Map<ToolId, ToolResource> = new Map()
  private toolIdsByIntegration: Map<string, Set<ToolId>> = new Map()

  constructor(apiClient: OneGrepApiClient) {
    this.apiClient = apiClient
    this.connectedClientManager = new ConnectedClientManager()
  }

  /** A helper function that fetches all the tool details for all the tools for an integration and then converts it into a Map of tool name to tool details. */
  private async getToolDetailsByToolName(
    integrationName: string
  ): Promise<Map<string, ApiToolResource>> {
    const toolDetails: ApiToolResource[] =
      await this.apiClient.get_integration_tools_api_v1_integrations__integration_name__tools_get(
        {
          params: {
            integration_name: integrationName
          }
        }
      )

    const toolDetailsMap = new Map<string, ApiToolResource>()

    toolDetails.forEach((toolDetails) => {
      toolDetailsMap.set(toolDetails.tool_name, toolDetails)
    })

    return toolDetailsMap
  }

  /**
   * Returns a list of MCPToolResource(s) for a given client config that can be used to interact with tools for
   * an integration. Ex. the clientConfig for the "Github".
   *
   * The returned list of resources will be each of the resources for the tools under the integration.
   *
   * Ex. in the case of "Github", each resource will be a tool that wraps tools such as create_repository, get_repository, etc.
   */
  private async getToolResourcesForIntegration(
    integrationClientConfig: RemoteClientConfig
  ): Promise<MCPToolResource[]> {
    // ? This will be updated in the future and likely removed altogether in favor of a better runtime discovery mechanism.
    const mcpConnectedClient = await this.connectedClientManager.getClient(
      integrationClientConfig
    )

    if (!mcpConnectedClient) {
      log.error(`No connected client found for ${integrationClientConfig.name}`)
      return []
    }

    const integrationName = integrationClientConfig.name

    // We will make 2 parallel requests to fetch all our tools and the tool details for all tools for this integration.
    // Then we'll combing the resuls to formulate the ToolResource(s).
    const promises: Array<Promise<any>> = [
      mcpConnectedClient.listTools(),
      this.getToolDetailsByToolName(integrationName)
    ]

    const [mcpTools, toolDetailsMap] = (await Promise.all(promises)) as [
      Tool[],
      Map<string, ApiToolResource>
    ]

    // Group tools and tool details by tool name
    const toolDataMap = new Map<
      string,
      { tool: MCPTool; apiToolResource: ApiToolResource }
    >()
    mcpTools.forEach((tool) => {
      toolDataMap.set(tool.name, {
        tool,
        apiToolResource: toolDetailsMap.get(tool.name)!
      })
    })

    // Now we can create the tool resources for this integration.
    const resources: Array<MCPToolResource> = []
    toolDataMap.forEach((toolData) => {
      if (toolData.apiToolResource === undefined) {
        // ! Failsafe to ensure that any new tools that are discoverable BUT do not have guardrails are not rendered.
        log.warn(
          `Tool details not found for tool ${toolData.tool.name}. Will not render this tool.`
        )
      } else {
        resources.push(
          toolResourceFromMcpTool(
            toolData.tool,
            toolData.apiToolResource,
            integrationClientConfig,
            this.connectedClientManager
          )
        )
      }
    })

    return resources
  }

  private async refreshToolsForIntegration(
    clientConfig: RemoteClientConfig
  ): Promise<IntegrationRefreshAttempt> {
    try {
      /** We want to update our tool cache for the tools we just retrieved via our integration client. */
      const resources: Array<MCPToolResource> =
        await this.getToolResourcesForIntegration(clientConfig)
      const newToolResourceIds = new Set(resources.map((tool) => tool.id))

      // ? Purely for logging purposes. Has no functional impact.
      const previouslyCachedToolIds =
        this.toolIdsByIntegration.get(clientConfig.name) ?? new Set<ToolId>()
      const staleToolIds =
        previouslyCachedToolIds.difference(newToolResourceIds)
      log.debug(`Removing ${staleToolIds.size} tools from ${clientConfig.name}`)

      // Update our tool cache for this integration
      log.debug(
        `Adding ${newToolResourceIds.size} tools to ${clientConfig.name}`
      )
      this.toolIdsByIntegration.set(clientConfig.name, newToolResourceIds)

      // Remove old tools for this integration only. Avoids race conditions when this method is called in parallel for multiple integrations.
      if (previouslyCachedToolIds.size > 0) {
        for (const toolId of previouslyCachedToolIds) {
          this.toolIdToResource.delete(toolId)
        }
      }

      // Add new tools for this integration
      resources.forEach((resource) => {
        this.toolIdToResource.set(resource.id, resource)
      })

      return new IntegrationRefreshAttempt(true, clientConfig.name)
    } catch (e) {
      log.error(
        `Error refreshing tools for integration ${clientConfig.name}`,
        e
      )
      return new IntegrationRefreshAttempt(false, clientConfig.name, e)
    }
  }

  private async refreshAllIntegrations(
    clientConfigs?: Array<RemoteClientConfig>
  ): Promise<Array<IntegrationRefreshAttempt>> {
    const configs = clientConfigs ?? this.allConfigs
    return await Promise.all(
      configs.map((intConfig) => this.refreshToolsForIntegration(intConfig))
    )
  }

  private async refreshClientConfigs(): Promise<void> {
    /** Refreshes the client configs in the toolcache. */
    const metaClientConfig =
      await this.apiClient.get_meta_client_api_v1_clients_meta_get()
    // log.debug(`Meta client config: ${JSON.stringify(metaClientConfig)}`)

    const hostClientConfigs =
      await this.apiClient.get_hosts_clients_api_v1_clients_hosts_get()
    log.debug(
      `Host client configs: ${JSON.stringify(hostClientConfigs, null, 2)}`
    )

    this.allConfigs = [metaClientConfig, ...hostClientConfigs]
    log.info(`${this.allConfigs.length} integrations configs refreshed`)
  }

  /**
   * Refreshes a single integration.
   *
   * @param integrationName - The name of the integration to refresh.
   * @returns True if the integration was refreshed successfully, false otherwise.
   */
  async refreshIntegration(integrationName: string): Promise<boolean> {
    const integrationClientConfig = this.allConfigs.find(
      (config) => config.name === integrationName
    )

    if (!integrationClientConfig) {
      log.error(`Integration config not found for ${integrationName}`)
      return false
    }

    const refreshAttempt = await this.refreshToolsForIntegration(
      integrationClientConfig
    )

    if (!refreshAttempt.success) {
      log.error(`Failed to refresh integration ${integrationName}`)
      return false
    }

    return true
  }

  async refresh(): Promise<boolean> {
    try {
      await this.refreshClientConfigs()

      // Check if we have any configs to process
      if (this.allConfigs.length === 0) {
        log.warn(
          'No integration configs found. Check your API connection and credentials.'
        )
        return false
      }

      const refreshResults = await this.refreshAllIntegrations()
      const successfulResults = refreshResults.filter(
        (result) => result.success
      )
      const failedResults = refreshResults.filter((result) => !result.success)

      // Log a simplified version of the results instead of the full objects
      log.debug(
        `Refresh results:\n\tSuccess: ${successfulResults.length}\n\tFailed: ${failedResults.length}`
      )

      // Log just the names and success status, not the entire objects
      refreshResults.forEach((result) => {
        if (result.success) {
          log.debug(
            `✅ Integration refresh succeeded: ${result.integrationName}`
          )
        } else {
          log.error(`❌ Integration refresh failed: ${result.integrationName}`)
        }
      })

      if (successfulResults.length > 0) {
        log.info(
          `Successfully refreshed ${successfulResults.length} integrations`
        )
        return true
      }

      // If we got here, all integrations failed
      log.error('All integration refreshes failed. Check logs for details.')
      return false
    } catch (error) {
      log.error('Error during refresh', error)
      return false
    }
  }

  async get(key: ToolId): Promise<ToolResource | undefined> {
    return this.toolIdToResource.get(key)
  }

  async list(): Promise<ToolResource[]> {
    return Array.from(this.toolIdToResource.values())
  }

  async cleanup(): Promise<void> {
    await this.connectedClientManager.close()
  }
}
