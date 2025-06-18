import {
  AuthenticationStatus,
  ToolServerProvider,
  ToolServer,
  Tool,
  SearchService,
  IntegrationsService,
  ToolprintRecommendationReadable,
  RegisteredToolprintReadable,
  ToolprintInput,
  ToolprintOutput,
  ProvidersService,
  AccountInformation,
  SearchResponseScoredItemRegisteredToolprintReadable,
  SearchRequest,
  ToolProperties,
  ToolResource,
  SearchResponseScoredItemTool,
  DefaultService,
  SdkService,
  AccountService,
  FlagsService,
  UpsertSecretRequest,
  UpsertSecretResponse,
  ServersService,
  ToolsService,
  ToolprintsService,
  SecretsService,
  InitializeResponse,
  GetAllFlagsResponse
} from '@toolprint/api-client'
import { makeApiCallWithResult } from './utils.js'
import { OneGrepApiClient, ToolServerClient } from './types.js'

export class OneGrepApiHighLevelClient {
  constructor(private readonly apiClient: OneGrepApiClient) { }

  async healthCheck(): Promise<boolean> {
    const result = await makeApiCallWithResult<void>(async () => {
      await DefaultService.healthHealthGet({
        client: this.apiClient
      })
    })
    return result.success
  }

  /** Returns the global "ai.txt" for an agent to gather details on what the API can do. */
  async getAiTxt(): Promise<string> {
    const result = await makeApiCallWithResult<string>(async () => {
      return await DefaultService.getAiDocumentationAiTxtGet({
        client: this.apiClient
      })
    })

    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async initialize(): Promise<InitializeResponse> {
    const result = await makeApiCallWithResult<InitializeResponse>(async () => {
      return await SdkService.initializeApiV1SdkInitializeGet({
        client: this.apiClient
      })
    })
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async authStatus(): Promise<AuthenticationStatus> {
    const result = await makeApiCallWithResult<AuthenticationStatus>(
      async () => {
        return await AccountService.getAuthStatusApiV1AccountAuthStatusGet({
          client: this.apiClient
        })
      }
    )
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async getAccountInformation(): Promise<AccountInformation> {
    const result = await makeApiCallWithResult<AccountInformation>(async () => {
      return await AccountService.getAccountInformationApiV1AccountGet({
        client: this.apiClient
      })
    })
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async createAccountByInvitation(
    invitationCode: string,
    email: string
  ): Promise<AccountInformation> {
    const result = await makeApiCallWithResult<AccountInformation>(async () => {
      return await AccountService.createAccountByInvitationApiV1AccountInvitationCodePost(
        {
          client: this.apiClient,
          body: { invitation_code: invitationCode, email: email }
        }
      )
    })
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async getFlags(): Promise<Record<string, boolean | string>> {
    const result = await makeApiCallWithResult<GetAllFlagsResponse>(
      async () => {
        return await FlagsService.getAllFlagsApiV1FlagsGet({
          client: this.apiClient
        })
      }
    )
    if (result.error) {
      throw result.error
    }
    return result.data!.flags as unknown as Record<string, boolean>
  }

  async getSecret(secretName: string): Promise<any> {
    const result = await makeApiCallWithResult<any>(async () => {
      return await SecretsService.getSecretApiV1SecretsSecretNameGet({
        client: this.apiClient,
        path: { secret_name: secretName }
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
        const request: UpsertSecretRequest = {
          value_type: 'string',
          value: secret
        }
        return await SecretsService.upsertSecretApiV1SecretsSecretNamePut({
          client: this.apiClient,
          body: {
            request: request
          },
          path: {
            secret_name: secretName
          }
        })
      }
    )
    if (result.error) {
      throw result.error
    }
    return result.data!.success
  }

  async getAllProviders(): Promise<ToolServerProvider[]> {
    const result = await makeApiCallWithResult<ToolServerProvider[]>(
      async () => {
        return await ProvidersService.listProvidersApiV1ProvidersGet({
          client: this.apiClient
        })
      }
    )
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async getServerName(serverId: string): Promise<string> {
    const result = await makeApiCallWithResult<ToolServer>(async () => {
      const toolServer = await ServersService.getServerApiV1ServersServerIdGet({
        client: this.apiClient,
        path: {
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

  async getAllServers(): Promise<Record<string, ToolServer>> {
    const result = await makeApiCallWithResult<ToolServer[]>(async () => {
      return await ServersService.listServersApiV1ServersGet({
        client: this.apiClient
      })
    })
    if (result.error) {
      throw result.error
    }
    const toolServersMap: Record<string, ToolServer> = {}
    for (const toolServer of result.data!) {
      toolServersMap[toolServer.id] = toolServer
    }
    return toolServersMap
  }

  async getAllServerNames(): Promise<string[]> {
    const servers = await this.getAllServers()
    return Object.values(servers).map((server) => server.name)
  }

  async getAllServersForProvider(
    providerName: string
  ): Promise<Record<string, ToolServer>> {
    const providers = await this.getAllProviders()
    const provider = providers.find(
      (provider) => provider.name === providerName
    )
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`)
    }
    const servers = await this.getAllServers()
    const serversByProvider: Record<string, ToolServer> = {}
    for (const server of Object.values(servers)) {
      if (server.provider_id === provider.id) {
        serversByProvider[server.id] = server as ToolServer
      }
    }
    return serversByProvider
  }

  /**
   * Get the client for a given server.
   * @param serverId - The ID of the server to get the client for.
   * @returns The client for the given server.
   */
  async getServerClient(serverId: string): Promise<ToolServerClient> {
    const result = await makeApiCallWithResult<ToolServerClient>(async () => {
      const toolServerClient =
        await ServersService.getServerClientApiV1ServersServerIdClientGet({
          client: this.apiClient,
          path: {
            server_id: serverId
          }
        })
      return toolServerClient
    })
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async listTools(): Promise<Tool[]> {
    const result = await makeApiCallWithResult<Tool[]>(async () => {
      return await ToolsService.listToolsApiV1ToolsGet({
        client: this.apiClient
      })
    })
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async getTool(toolId: string): Promise<Tool> {
    const result = await makeApiCallWithResult<Tool>(async () => {
      return await ToolsService.getToolApiV1ToolsToolIdGet({
        client: this.apiClient,
        path: {
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
        await ToolsService.getToolPropertiesApiV1ToolsToolIdPropertiesGet({
          path: {
            tool_id: toolId
          }
        })
      return toolProperties
    })
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async upsertToolTags(
    integrationName: string,
    toolNames: string[],
    tags: Record<string, any>
  ): Promise<Array<ToolResource>> {
    const result = await makeApiCallWithResult<Array<ToolResource>>(
      async () => {
        return await IntegrationsService.upsertMultipleToolCustomTagsApiV1IntegrationsIntegrationNameToolsCustomTagsPost(
          {
            client: this.apiClient,
            path: { integration_name: integrationName },
            body: { tool_names: toolNames, tags: tags }
          }
        )
      }
    )
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async getToolResource(toolId: string): Promise<ToolResource> {
    const result = await makeApiCallWithResult<ToolResource>(async () => {
      const toolResource =
        await ToolsService.getToolResourceApiV1ToolsToolIdResourceGet({
          client: this.apiClient,
          path: {
            tool_id: toolId
          }
        })
      return toolResource
    })
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async getToolResourcesBatch(
    toolIds: string[]
  ): Promise<Map<string, ToolResource>> {
    const result = await makeApiCallWithResult<ToolResource[]>(async () => {
      const toolResources =
        await ToolsService.getToolResourcesBatchApiV1ToolsResourcesBatchPost({
          client: this.apiClient,
          body: {
            ids: toolIds
          }
        })
      return toolResources
    })
    if (result.error) {
      throw result.error
    }

    const toolResourcesMap: Map<string, ToolResource> = new Map()
    for (const toolResource of result.data!) {
      toolResourcesMap.set(toolResource.tool.id, toolResource)
    }
    return toolResourcesMap
  }

  async getToolResourcesForIntegration(
    integrationName: string
  ): Promise<ToolResource[]> {
    const result = await makeApiCallWithResult<ToolResource[]>(async () => {
      return await IntegrationsService.getIntegrationToolsApiV1IntegrationsIntegrationNameToolsGet(
        {
          client: this.apiClient,
          path: {
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

  async searchTools(
    query: string,
    options?: SearchRequest
  ): Promise<SearchResponseScoredItemTool> {
    const result = await makeApiCallWithResult<SearchResponseScoredItemTool>(
      async () => {
        return await SearchService.searchToolsApiV1SearchToolsPost({
          client: this.apiClient,
          body: {
            ...options,
            query: query
          }
        })
      }
    )
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  /**
   * Search for toolprints.
   * @param query - The query to search for.
   * @returns The search results.
   */
  async searchToolprints(
    query: string,
    options?: SearchRequest
  ): Promise<SearchResponseScoredItemRegisteredToolprintReadable> {
    const result =
      await makeApiCallWithResult<SearchResponseScoredItemRegisteredToolprintReadable>(
        async () => {
          return await SearchService.searchToolprintsApiV1SearchToolprintsPost({
            client: this.apiClient,
            body: {
              // the query parameter takes precedence over options.query
              ...options,
              query: query
            }
          })
        }
      )
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async recommendToolprint(
    goal: string
  ): Promise<ToolprintRecommendationReadable> {
    const result = await makeApiCallWithResult<ToolprintRecommendationReadable>(
      async () => {
        return await SearchService.getToolprintRecommendationApiV1SearchToolprintsRecommendationPost(
          {
            client: this.apiClient,
            body: {
              query: goal
            }
          }
        )
      }
    )
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async newToolprint(
    toolprint: ToolprintInput
  ): Promise<RegisteredToolprintReadable> {
    const result = await makeApiCallWithResult<RegisteredToolprintReadable>(
      async () => {
        return await ToolprintsService.createToolprintApiV1ToolprintsPost({
          client: this.apiClient,
          body: toolprint
        })
      }
    )
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async newToolprintFromJson(json: string): Promise<ToolprintOutput> {
    const result = await makeApiCallWithResult<ToolprintOutput>(async () => {
      const output: ToolprintOutput =
        (await ToolprintsService.createToolprintJsonApiV1ToolprintsJsonPost({
          client: this.apiClient,
          body: {
            content: json
          }
        })) as unknown as ToolprintOutput
      return output
    })
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async newToolprintFromYaml(
    yaml: string
  ): Promise<RegisteredToolprintReadable> {
    const result = await makeApiCallWithResult<ToolprintOutput>(async () => {
      const output: ToolprintOutput =
        (await ToolprintsService.createToolprintYamlApiV1ToolprintsYamlPost({
          client: this.apiClient,
          body: yaml
        })) as unknown as ToolprintOutput
      return output
    })
    if (result.error) {
      throw result.error
    }
    return result.data! as unknown as RegisteredToolprintReadable
  }

  async validateToolprint(toolprint: ToolprintInput): Promise<boolean> {
    const result = await makeApiCallWithResult<boolean>(async () => {
      return await ToolprintsService.validateToolprintApiV1ToolprintsValidatePost(
        {
          client: this.apiClient,
          body: toolprint
        }
      )
    })
    if (result.error) {
      throw result.error
    } else if (!result.success) {
      return false
    }
    return true
  }

  async validateToolprintInJson(json: string): Promise<boolean> {
    const result = await makeApiCallWithResult<boolean>(async () => {
      return await ToolprintsService.validateToolprintJsonApiV1ToolprintsValidateJsonPost(
        {
          client: this.apiClient,
          body: {
            content: json
          }
        }
      )
    })
    if (result.error) {
      throw result.error
    } else if (!result.success) {
      return false
    }
    return true
  }

  async validateToolprintInYaml(yaml: string): Promise<boolean> {
    const result = await makeApiCallWithResult<string>(async () => {
      return await ToolprintsService.validateToolprintYamlApiV1ToolprintsValidateYamlPost(
        {
          client: this.apiClient,
          body: yaml
        }
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
      return await ToolprintsService.getToolprintSchemaApiV1ToolprintsWellKnownSchemaGet(
        {
          client: this.apiClient
        }
      )
    })
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  async getToolprintTemplate(): Promise<string> {
    const result = await makeApiCallWithResult<string>(async () => {
      return await ToolprintsService.getToolprintTemplateApiV1ToolprintsWellKnownTemplateGet(
        {
          client: this.apiClient
        }
      )
    })
    if (result.error) {
      throw result.error
    }
    return result.data!
  }

  /** Returns the "ai.txt" instruction set for toolprint generation. */
  async getToolprintAiTxt(): Promise<string> {
    const result = await makeApiCallWithResult<string>(async () => {
      return await ToolprintsService.getToolprintInstructionsApiV1ToolprintsWellKnownAiTxtGet(
        {
          client: this.apiClient
        }
      )
    })
    if (result.error) {
      throw result.error
    }
    return result.data!
  }
}
