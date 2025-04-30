import { ToolServerId } from '../../types.js'
import { OneGrepApiClient } from './client.js'
import {
  SearchResponseScoredItemTool,
  Tool,
  ToolProperties,
  ToolResource,
  ToolServer,
  ToolServerClient,
  InitializeResponse
} from './types.js'

export class OneGrepApiHighLevelClient {
  constructor(private readonly apiClient: OneGrepApiClient) {}

  async initialize(): Promise<InitializeResponse> {
    return await this.apiClient.initialize_api_v1_sdk_initialize_get()
  }

  async getServerName(serverId: string): Promise<string> {
    const toolServer =
      await this.apiClient.get_server_api_v1_servers__server_id__get({
        params: {
          server_id: serverId
        }
      })
    return toolServer.name
  }

  async getAllServers(): Promise<Map<ToolServerId, ToolServer>> {
    const toolServers: ToolServer[] =
      await this.apiClient.list_servers_api_v1_servers__get()
    const toolServersMap: Map<ToolServerId, ToolServer> = new Map()
    for (const toolServer of toolServers) {
      toolServersMap.set(toolServer.id, toolServer)
    }
    return toolServersMap
  }

  async getAllServerNames(): Promise<string[]> {
    const servers = await this.getAllServers()
    return Array.from(servers.values()).map((server) => server.name)
  }

  /**
   * Get the client for a given server.
   * @param serverId - The ID of the server to get the client for.
   * @returns The client for the given server.
   */
  async getServerClient(serverId: string): Promise<ToolServerClient> {
    const toolServerClient =
      await this.apiClient.get_server_client_api_v1_servers__server_id__client_get(
        {
          params: {
            server_id: serverId
          }
        }
      )
    return toolServerClient
  }

  async listTools(): Promise<Tool[]> {
    const tools = await this.apiClient.list_tools_api_v1_tools__get()
    return tools
  }

  async getTool(toolId: string): Promise<Tool> {
    const tool = await this.apiClient.get_tool_api_v1_tools__tool_id__get({
      params: {
        tool_id: toolId
      }
    })
    return tool
  }

  async getToolProperties(toolId: string): Promise<ToolProperties> {
    const toolProperties =
      await this.apiClient.get_tool_properties_api_v1_tools__tool_id__properties_get(
        {
          params: {
            tool_id: toolId
          }
        }
      )
    return toolProperties
  }

  async getToolResource(toolId: string): Promise<ToolResource> {
    const toolResource =
      await this.apiClient.get_tool_resource_api_v1_tools__tool_id__resource_get(
        {
          params: {
            tool_id: toolId
          }
        }
      )
    return toolResource
  }

  async getToolResourcesForIntegration(
    integrationName: string
  ): Promise<ToolResource[]> {
    return await this.apiClient.get_integration_tools_api_v1_integrations__integration_name__tools_get(
      {
        params: {
          integration_name: integrationName
        }
      }
    )
  }

  async searchTools(query: string): Promise<SearchResponseScoredItemTool> {
    const response = await this.apiClient.search_tools_api_v1_search_tools_post(
      {
        query: query
      }
    )
    return response
  }
}
