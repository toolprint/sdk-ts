import { OneGrepApiClient } from 'core/api/client.js'
import {
  ApiToolResource,
  ToolCache,
  ToolId,
  EquippedTool,
  ToolFilter,
  ToolMetadata,
  ScoredResult
} from 'types.js'
import { BlaxelClient } from './client.js'
import { Tool as BlaxelTool } from '@blaxel/sdk/tools/types'

export class BlaxelToolCache implements ToolCache {
  private apiClient: OneGrepApiClient
  private blaxelClient: BlaxelClient
  private toolIdToResource: Map<ToolId, EquippedTool> = new Map()
  private integrationToResources: Map<string, EquippedTool[]> = new Map()

  constructor(apiClient: OneGrepApiClient) {
    this.apiClient = apiClient
    this.blaxelClient = new BlaxelClient()
  }

  async refreshIntegration(
    blaxelServerName: string,
    forceRefreshClient: boolean = false
  ): Promise<boolean> {
    if (forceRefreshClient) {
      await this.blaxelClient.refreshIntegration(blaxelServerName)
    }

    const staleResources = this.integrationToResources.get(blaxelServerName)
    if (staleResources !== undefined) {
      for (const resource of staleResources) {
        this.toolIdToResource.delete(resource.metadata.id)
      }
      this.integrationToResources.delete(blaxelServerName)
    }

    // Get the raw MCP tools from the blaxel server.
    const server = await this.blaxelClient.getToolServer(blaxelServerName)
    const mcpTools = await server.listTools()
    const toolNameToMcpTool = new Map<string, BlaxelTool>()
    for (const tool of mcpTools) {
      toolNameToMcpTool.set(tool.name, tool)
    }

    // Get the metadata from the api for all the tools for the integration.
    // console.debug(`Getting API tool resources for ${blaxelServerName}`)
    const apiToolResources: ApiToolResource[] =
      await this.apiClient.get_integration_tools_api_v1_integrations__integration_name__tools_get(
        {
          params: {
            integration_name: blaxelServerName
          }
        }
      )

    // Generate the ToolResource given the underlying MCP tool and our API metadata.
    for (const toolResourceData of apiToolResources) {
      const toolName = toolResourceData.tool_name
      if (!toolNameToMcpTool.has(toolName)) {
        console.warn(
          `Tool ${toolName} not found in blaxel server ${blaxelServerName}`
        )
        continue
      }

      // const blaxelTool = toolNameToMcpTool.get(toolName)!

      // ! We're deleting this class?
      // const toolResource: BlaxelToolResource = new BlaxelToolResource(
      //   this.blaxelClient,
      //   blaxelServerName,
      //   blaxelTool,
      //   toolResourceData
      // )

      // this.toolIdToResource.set(toolResource.metadata.id, toolResource)
    }

    return true
  }

  async refresh(): Promise<boolean> {
    await this.blaxelClient.refresh()
    this.toolIdToResource.clear()

    // Generate a new tool for each of the tools in each of the tool servers in the blaxel client
    // after it refreshes.
    const toolServers = await this.blaxelClient.getToolServers()
    for (const [serverName, _] of toolServers) {
      await this.refreshIntegration(serverName)
    }

    return true
  }

  async metadata(toolFilter?: ToolFilter): Promise<Map<ToolId, ToolMetadata>> {
    const metadataMap = new Map<ToolId, ToolMetadata>()
    for (const [toolId, resource] of this.toolIdToResource) {
      if (toolFilter === undefined || toolFilter(resource.metadata)) {
        metadataMap.set(toolId, resource.metadata)
      }
    }
    return metadataMap
  }

  async get(key: ToolId): Promise<EquippedTool> {
    const resource = this.toolIdToResource.get(key)
    if (resource === undefined) {
      throw new Error(`Tool ${key} not found`)
    }
    return resource
  }

  async list(): Promise<EquippedTool[]> {
    return Array.from(this.toolIdToResource.values()).map((resource) => {
      return {
        metadata: resource.metadata,
        tags: resource.tags,
        handle: resource.handle
      }
    })
  }

  async search(_: string): Promise<Array<ScoredResult<EquippedTool>>> {
    return [] // TODO: Implement
  }

  async cleanup(): Promise<void> {
    await this.blaxelClient.cleanup()
  }
}
