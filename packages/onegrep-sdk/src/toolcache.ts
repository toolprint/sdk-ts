import { OneGrepApiClient } from './core/api/client.js'
// import { ConnectedClientManager } from './mcp/client.js'; // ! Add back when MCP is supported
import { McpCallToolResultContent, parseMcpContent } from './mcp/toolcall.js'

import {
  McpTool as BlaxelMcpServer,
  retrieveMCPClient as getBlaxelMcpServer
} from '@blaxel/sdk/tools/mcpTool'

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

import {
  ScoredResult,
  ToolCache,
  ToolCallInput,
  ToolCallResponse,
  ToolHandle,
  ToolId,
  ToolMetadata,
  ToolServerId,
  ToolTags,
  JsonSchema,
  EquippedTool,
  ToolFilter,
  ToolCallError
} from './types.js'

import {
  Tool,
  ToolProperties,
  ToolServerClient,
  SearchResponseScoredItemTool,
  // MCPToolServerClient, // ! Add back when MCP is supported
  BlaxelToolServerClient
} from './core/api/types.js'

import { OneGrepApiHighLevelClient } from './core/api/high.js'
import { Cache, createCache } from 'cache-manager'
import { Keyv } from 'keyv'

import { log } from '@repo/utils'
import { z } from 'zod'
import { jsonSchemaUtils } from './schema.js'

export class UniversalToolCache implements ToolCache {
  private highLevelClient: OneGrepApiHighLevelClient
  // private connectedClientManager: ConnectedClientManager; // ! Add back when MCP is supported

  private serverNameCache: Cache
  private serverClientCache: Cache
  private toolPropertiesCache: Cache
  private toolMetadataCache: Cache

  constructor(apiClient: OneGrepApiClient) {
    this.highLevelClient = new OneGrepApiHighLevelClient(apiClient)

    // Configure caches with TTL and max size
    this.serverNameCache = createCache({
      cacheId: 'server-name-cache',
      stores: [
        new Keyv({ ttl: 1000 * 60 * 60 * 24 }) // 24 hours
      ]
    })

    this.serverClientCache = createCache({
      cacheId: 'server-client-cache',
      stores: [
        new Keyv({ ttl: 1000 * 60 * 60 * 24 }) // 24 hours
      ]
    })

    this.toolPropertiesCache = createCache({
      cacheId: 'tool-properties-cache',
      stores: [
        new Keyv({ ttl: 1000 * 60 }) // 60 seconds
      ]
    })

    this.toolMetadataCache = createCache({
      cacheId: 'tool-metadata-cache',
      stores: [
        new Keyv({ ttl: 1000 * 30 }) // 30 seconds
      ]
    })
  }

  async refresh(): Promise<boolean> {
    /**
     * Refresh the toolcache using a pipeline pattern.
     *
     * The pipeline executes steps in sequence:
     * 1. Refresh server names (by server id)
     * 2. Clear server clients (by server id)
     * 3. Clear tool metadata (by tool id)
     * 4. Clear tool properties (by tool id)
     *
     * If any step fails or raises an exception, the refresh process stops and returns False.
     */
    const pipeline = [
      this.refreshServerNameCache.bind(this),
      this.clearServerClientCache.bind(this),
      this.clearToolMetadataCache.bind(this),
      this.clearToolPropertiesCache.bind(this)
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

  private async getServerName(serverId: ToolServerId): Promise<string> {
    return await this.serverNameCache.wrap(serverId, async () => {
      return await this.highLevelClient.getServerName(serverId)
    })
  }

  async refreshServerNameCache(): Promise<boolean> {
    /**
     * Refresh the server ids by fetching server ids from the API.
     * Returns true if successful, false otherwise.
     */
    this.serverNameCache.clear()
    const serverNames = this.highLevelClient.getAllServerNames()

    for (const [serverId, serverName] of Object.entries(serverNames)) {
      this.serverNameCache.set(serverId as ToolServerId, serverName)
    }

    log.info(
      `Refreshed server name cache with ${Object.keys(serverNames).length} server names`
    )
    return true
  }

  private async getServerClient(
    serverId: ToolServerId
  ): Promise<ToolServerClient> {
    return await this.serverClientCache.wrap(serverId, async () => {
      return await this.highLevelClient.getServerClient(serverId)
    })
  }

  async clearServerClientCache(): Promise<boolean> {
    /**
     * Clear the server client cache.
     * Returns true if successful, false otherwise.
     */
    this.serverClientCache.clear()
    log.info('Cleared server client cache')
    return true
  }

  // In order to keep this performant, we cache this server name for integration name and make no other API calls
  private async hydrateMetadata(tool: Tool): Promise<ToolMetadata> {
    const serverName: string = await this.getServerName(tool.server_id)

    // ! This is the python version for parsing the input schema
    // If input_schema is not present, we default to "always valid"
    // const parseInputSchema = (schema: JsonSchema | null): JsonSchema => {
    //   if (!schema) {
    //     return true;
    //   } else if (schema.anyof_schema_1_validator) {
    //     return schema.anyof_schema_1_validator;
    //   } else if (schema.anyof_schema_2_validator) {
    //     return schema.anyof_schema_2_validator;
    //   } else {
    //     return true;
    //   }
    // };

    // ! Why are these generated types not correct?
    const description: string = tool.description as string
    const iconUrl: URL | undefined = tool.icon_url as URL | undefined

    return {
      id: tool.id,
      name: tool.name,
      description: description,
      iconUrl: iconUrl,
      serverId: tool.server_id,
      integrationName: serverName,
      inputSchema: tool.input_schema as JsonSchema // ! Do we need to parse the input schema?
    }
  }

  private async getToolMetadata(toolId: ToolId): Promise<ToolMetadata> {
    return await this.toolMetadataCache.wrap(toolId, async () => {
      const tool: Tool = await this.highLevelClient.getTool(toolId)
      return await this.hydrateMetadata(tool)
    })
  }

  async clearToolMetadataCache(): Promise<boolean> {
    /**
     * Clear the tool metadata cache.
     * Returns true if successful, false otherwise.
     */
    this.toolMetadataCache.clear()
    log.info('Cleared tool metadata cache')
    return true
  }

  private async getToolProperties(toolId: ToolId): Promise<ToolProperties> {
    return await this.toolPropertiesCache.wrap(toolId, async () => {
      return await this.highLevelClient.getToolProperties(toolId)
    })
  }

  async clearToolPropertiesCache(): Promise<boolean> {
    /**
     * Clear the tool properties cache.
     * Returns true if successful, false otherwise.
     */
    this.toolPropertiesCache.clear()
    log.info('Cleared tool properties cache')
    return true
  }

  private async getHandle(toolId: ToolId): Promise<ToolHandle> {
    const toolMetadata: ToolMetadata = await this.getToolMetadata(toolId)
    const toolServerClient: ToolServerClient = await this.getServerClient(
      toolMetadata.serverId
    )

    if (toolServerClient.client_type === 'mcp') {
      // Implement and optimize
      if (toolServerClient.transport_type !== 'sse') {
        throw new Error(
          'SSE is the only currently supported transport type for MCP tools'
        )
      }

      throw new Error('MCP tools are not yet supported')

      // ! MCP is not supported yet
      // // TODO: Deprecate RemoteClientConfig
      // const clientConfig: RemoteClientConfig = {
      //   org_id: "",
      //   name: toolMetadata.integration_name,
      //   display_name: "",
      //   description: "",
      //   endpoint: toolServerClient.url,
      //   required_headers: {},
      //   ready: true
      // };

      // const handleFactory = new MCPSSEHandleFactory(
      //   toolMetadata,
      //   clientConfig,
      //   this.connectedClientManager
      // );

      // return handleFactory.newHandle();
    } else if (toolServerClient.client_type === 'blaxel') {
      const blaxelToolServerClient = toolServerClient as BlaxelToolServerClient

      const toolServer: BlaxelMcpServer = getBlaxelMcpServer(
        blaxelToolServerClient.blaxel_function
      )
      await toolServer.refresh()

      log.info(`Found blaxel tool server: ${toolServerClient.blaxel_function}`)

      // TODO: How to determine the output type?
      const parseResultFunc = (
        result: CallToolResult
      ): ToolCallResponse<any> => {
        log.debug('Parsing blaxel tool result')
        const resultContent = result.content as McpCallToolResultContent
        const content = parseMcpContent(resultContent)
        return {
          isError: false,
          content: content,
          mode: 'single',
          toZod: () => {
            return z.object({})
          }
        }
      }

      const call = async (
        toolCallInput: ToolCallInput
      ): Promise<ToolCallResponse<any>> => {
        log.info(
          `Calling blaxel tool with input: ${JSON.stringify(toolCallInput)}`
        )
        try {
          const validator = jsonSchemaUtils.getValidator(
            toolMetadata.inputSchema
          )
          const valid = validator(toolCallInput.args)
          if (!valid) {
            throw new Error('Invalid tool input arguments')
          }
          const result = (await toolServer.call(
            toolMetadata.name,
            toolCallInput.args
          )) as CallToolResult // ! Why does blaxel not return a CallToolResult?
          return parseResultFunc(result)
        } catch (error) {
          if (error instanceof Error) {
            return {
              isError: true,
              message: error.message
            } as ToolCallError
          } else {
            return {
              isError: true,
              message: 'An unknown error occurred'
            } as ToolCallError
          }
        }
      }

      const callSync = (_: ToolCallInput): ToolCallResponse<any> => {
        throw new Error('Blaxel tools do not support sync calls')

        // ! TODO: Was having issues with the sync call, so we're not using it yet.
        // log.info(`Calling blaxel tool with input: ${JSON.stringify(toolCallInput)}`);
        // const result: CallToolResult = toolServer.call(toolCallInput.name, toolCallInput.args);
        // return parseResultFunc(result);
      }

      return {
        call: (input: ToolCallInput) => call(input),
        callSync: (_: ToolCallInput) => callSync(_)
      }
    } else {
      throw new TypeError(
        `Unknown tool server client type: ${typeof toolServerClient}`
      )
    }
  }

  async metadata(toolFilter?: ToolFilter): Promise<Map<ToolId, ToolMetadata>> {
    // Consider passing filter instructions to the API client
    const tools: Tool[] = await this.highLevelClient.listTools()
    log.info(`Fetched ${tools.length} tools`)

    const result: Map<ToolId, ToolMetadata> = new Map()

    for (const tool of tools) {
      const metadata = await this.hydrateMetadata(tool)
      if (!toolFilter || toolFilter(metadata)) {
        result.set(tool.id, metadata)
      }
    }

    return result
  }

  async get(toolId: ToolId): Promise<EquippedTool> {
    const toolMetadata: ToolMetadata = await this.getToolMetadata(toolId)
    log.debug(`Fetched tool metadata for ${toolId}`)

    const toolProperties: ToolProperties = await this.getToolProperties(toolId)
    log.debug(`Fetched tool properties for ${toolId}`)

    const tags: ToolTags = toolProperties.tags

    const handle: ToolHandle = await this.getHandle(toolId)
    log.debug(`Fetched tool handle for ${toolId}`)

    const equippedTool: EquippedTool = {
      metadata: toolMetadata,
      tags: tags,
      handle: handle
    }

    return equippedTool
  }

  async search(query: string): Promise<ScoredResult<EquippedTool>[]> {
    log.info(`Searching for tools with query: ${query}`)
    const response: SearchResponseScoredItemTool =
      await this.highLevelClient.searchTools(query)

    const results: ScoredResult<EquippedTool>[] = []

    for (const result of response.results) {
      const equippedTool = await this.get(result.item.id)
      results.push({
        result: equippedTool,
        score: result.score
      })
    }

    return results
  }

  async cleanup(): Promise<void> {
    this.serverNameCache.clear()
    this.serverClientCache.clear()
    this.toolMetadataCache.clear()
    this.toolPropertiesCache.clear()
  }
}
