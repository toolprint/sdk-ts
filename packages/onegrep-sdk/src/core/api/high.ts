import { OneGrepApiClient } from './client.js'
import {
  SearchResponseScoredItemTool,
  Tool,
  ToolProperties,
  ToolServer,
  ToolServerClient
} from './types.js'

export class OneGrepApiHighLevelClient {
  constructor(private readonly apiClient: OneGrepApiClient) {}

  async getServerName(serverId: string): Promise<string> {
    const toolServer =
      await this.apiClient.get_server_api_v1_servers__server_id__get({
        params: {
          server_id: serverId
        }
      })
    return toolServer.name
  }

  async getAllServerNames(): Promise<string[]> {
    const toolServers: ToolServer[] =
      await this.apiClient.list_servers_api_v1_servers__get()
    return toolServers.map((toolServer) => toolServer.name)
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

  async searchTools(query: string): Promise<SearchResponseScoredItemTool> {
    const response = await this.apiClient.search_tools_api_v1_search_tools_post(
      {
        query: query
      }
    )
    return response
  }
}
