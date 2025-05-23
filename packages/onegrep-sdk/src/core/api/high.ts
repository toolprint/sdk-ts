import { ToolServerId } from '~/types.js'

import { OneGrepApiClient } from './client.js'
import {
  SearchResponseScoredItemTool,
  Tool,
  ToolProperties,
  ToolResource,
  ToolServer,
  ToolServerClient,
  InitializeResponse,
  UpsertSecretRequest,
  UpsertSecretResponse,
  FlagsResponse,
  AuthenticationStatus,
  ToolprintRecommendation,
  Toolprint,
  RegisteredToolprint
} from './types.js'

import { makeApiCallWithResult } from './utils.js'

export class OneGrepApiHighLevelClient {
  constructor(private readonly apiClient: OneGrepApiClient) {}

  async healthCheck(): Promise<boolean> {
    const result = await makeApiCallWithResult<void>(async () => {
      await this.apiClient.health_health_get()
    })
    return result.success
  }

  async initialize(): Promise<InitializeResponse> {
    const result = await makeApiCallWithResult<InitializeResponse>(async () => {
      return await this.apiClient.initialize_api_v1_sdk_initialize_get()
    })
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async authStatus(): Promise<AuthenticationStatus> {
    const result = await makeApiCallWithResult<AuthenticationStatus>(
      async () => {
        return await this.apiClient.get_auth_status_api_v1_account_auth_status_get()
      }
    )
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async getFlags(): Promise<FlagsResponse> {
    const result = await makeApiCallWithResult<FlagsResponse>(async () => {
      return await this.apiClient.get_all_flags_api_v1_flags__get()
    })
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async getSecret(secretName: string): Promise<any> {
    const result = await makeApiCallWithResult<any>(async () => {
      return await this.apiClient.get_secret_api_v1_secrets__secret_name__get({
        params: { secret_name: secretName }
      })
    })
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async upsertSecret(secretName: string, secret: string): Promise<boolean> {
    const result = await makeApiCallWithResult<UpsertSecretResponse>(
      async () => {
        const body: UpsertSecretRequest = {
          value_type: 'string',
          value: secret
        }
        return await this.apiClient.upsert_secret_api_v1_secrets__secret_name__put(
          {
            request: body
          },
          {
            params: {
              secret_name: secretName
            }
          }
        )
      }
    )
    if (result.error) {
      throw result.error
    }
    return result.data!.success
  }

  async getServerName(serverId: string): Promise<string> {
    const result = await makeApiCallWithResult<ToolServer>(async () => {
      const toolServer =
        await this.apiClient.get_server_api_v1_servers__server_id__get({
          params: {
            server_id: serverId
          }
        })
      return toolServer
    })
    if (result.error) {
      throw result.error
    }
    return result.data!.name
  }

  async getAllServers(): Promise<Map<ToolServerId, ToolServer>> {
    const result = await makeApiCallWithResult<ToolServer[]>(async () => {
      return await this.apiClient.list_servers_api_v1_servers__get()
    })
    if (result.error) {
      throw result.error
    }
    const toolServersMap: Map<ToolServerId, ToolServer> = new Map()
    for (const toolServer of result.data!) {
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
    const result = await makeApiCallWithResult<ToolServerClient>(async () => {
      const toolServerClient =
        await this.apiClient.get_server_client_api_v1_servers__server_id__client_get(
          {
            params: {
              server_id: serverId
            }
          }
        )
      return toolServerClient
    })
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async listTools(): Promise<Tool[]> {
    const result = await makeApiCallWithResult<Tool[]>(async () => {
      return await this.apiClient.list_tools_api_v1_tools__get()
    })
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async getTool(toolId: string): Promise<Tool> {
    const result = await makeApiCallWithResult<Tool>(async () => {
      return await this.apiClient.get_tool_api_v1_tools__tool_id__get({
        params: {
          tool_id: toolId
        }
      })
    })
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async getToolProperties(toolId: string): Promise<ToolProperties> {
    const result = await makeApiCallWithResult<ToolProperties>(async () => {
      const toolProperties =
        await this.apiClient.get_tool_properties_api_v1_tools__tool_id__properties_get(
          {
            params: {
              tool_id: toolId
            }
          }
        )
      return toolProperties
    })
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async getToolResource(toolId: string): Promise<ToolResource> {
    const result = await makeApiCallWithResult<ToolResource>(async () => {
      const toolResource =
        await this.apiClient.get_tool_resource_api_v1_tools__tool_id__resource_get(
          {
            params: {
              tool_id: toolId
            }
          }
        )
      return toolResource
    })
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async getToolResourcesForIntegration(
    integrationName: string
  ): Promise<ToolResource[]> {
    const result = await makeApiCallWithResult<ToolResource[]>(async () => {
      return await this.apiClient.get_integration_tools_api_v1_integrations__integration_name__tools_get(
        {
          params: {
            integration_name: integrationName
          }
        }
      )
    })
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async searchTools(query: string): Promise<SearchResponseScoredItemTool> {
    const result = await makeApiCallWithResult<SearchResponseScoredItemTool>(
      async () => {
        return await this.apiClient.search_tools_api_v1_search_tools_post({
          query: query
        })
      }
    )
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async recommendToolprint(goal: string): Promise<ToolprintRecommendation> {
    const result = await makeApiCallWithResult<ToolprintRecommendation>(
      async () => {
        return await this.apiClient.get_toolprint_recommendation_api_v1_search_toolprints_recommendation_post(
          {
            query: goal
          }
        )
      }
    )
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async newToolprint(toolprint: Toolprint): Promise<Toolprint> {
    const result = await makeApiCallWithResult<Toolprint>(async () => {
      const registeredToolprint: RegisteredToolprint =
        await this.apiClient.create_toolprint_api_v1_toolprints__post(toolprint)
      return registeredToolprint.toolprint
    })
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async validateToolprint(toolprint: Toolprint): Promise<boolean> {
    const result = await makeApiCallWithResult<unknown>(async () => {
      return await this.apiClient.validate_toolprint_api_v1_toolprints_validate_post(
        toolprint
      )
    })
    if (result.error) {
      throw result.error
    } else if (!result.success) {
      return false
    }
    return true
  }

  async getToolprintJsonSchema(): Promise<object> {
    const result = await makeApiCallWithResult<object>(async () => {
      return await this.apiClient.get_toolprint_schema_api_v1_toolprints__well_known_schema_get()
    })
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async getToolprintTemplate(): Promise<string> {
    const result = await makeApiCallWithResult<unknown>(async () => {
      return await this.apiClient.get_toolprint_template_api_v1_toolprints__well_known_template_get()
    })
    if (result.error) {
      throw result.error
    }
    return result.data! as unknown as string
  }
}
