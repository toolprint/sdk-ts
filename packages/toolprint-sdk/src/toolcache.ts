import {
  Tool,
  ToolProperties,
  ToolResource,
  SearchResponseScoredItemTool,
  InitializeResponse,
  Prompt,
  ScoredItemTool
} from '@toolprint/api-client'

import { ToolServerClient } from '~/core/api/types.js'

import {
  ScoredResult,
  ToolCache,
  ToolId,
  ToolServerId,
  JsonSchema,
  FilterOptions,
  ToolDetails,
  BasicToolDetails,
  ToolHandle,
  ConnectionManager,
  ToolCallInput,
  ToolCallResponse,
  ToolCallError,
  Recommendation
} from './types.js'

import { OneGrepApiClient } from '~/core/index.js'
import { OneGrepApiHighLevelClient } from '~/core/index.js'

import { Keyv } from 'keyv'
import { Cache, createCache } from 'cache-manager'
import { ToolServerConnectionManager } from '~/connection.js'

import { OneGrepApiError } from './core/api/utils.js'

import { log } from '~/core/log.js'

/**
 * A wrapper around a ToolHandle that provides a safe way to call the tool.
 * If the ToolHandle call fails, it will return a ToolCallError instead of
 * throwing an unhandled error.
 */
class SafeToolHandle implements ToolHandle {
  private unsafeCall: (input: ToolCallInput) => Promise<ToolCallResponse<any>>
  private unsafeCallSync: (input: ToolCallInput) => ToolCallResponse<any>

  constructor(readonly toolHandle: ToolHandle) {
    this.unsafeCall = toolHandle.call
    this.unsafeCallSync = toolHandle.callSync
  }

  private async safeCall(input: ToolCallInput): Promise<ToolCallResponse<any>> {
    try {
      return await this.unsafeCall(input)
    } catch (error) {
      log.error(`Broken ToolHandle: ${error}`)
      return {
        isError: true,
        message: `Async ToolHandle call unexpectedly failed: ${error}`
      } as ToolCallError
    }
  }

  private safeCallSync(input: ToolCallInput): ToolCallResponse<any> {
    try {
      return this.unsafeCallSync(input)
    } catch (error) {
      log.error(`Broken ToolHandle: ${error}`)
      return {
        isError: true,
        message: `Sync ToolHandle call unexpectedly failed: ${error}`
      } as ToolCallError
    }
  }

  call(input: ToolCallInput): Promise<ToolCallResponse<any>> {
    return this.safeCall(input)
  }

  callSync(input: ToolCallInput): ToolCallResponse<any> {
    return this.safeCallSync(input)
  }
}

class ToolCacheError extends Error {
  constructor(message: string, cause?: Error) {
    super(message, { cause })
    this.name = 'ToolCacheError'
  }
}

type MethodDecorator = (
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => PropertyDescriptor | void

function handleErrors(): MethodDecorator {
  return function (
    _: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value
    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args)
      } catch (error) {
        if (error instanceof Error) {
          if (error instanceof OneGrepApiError) {
            log.error(
              `Issue with OneGrep API in ${propertyKey.toString()}: ${error.message}`
            )
          }
          throw new ToolCacheError(
            `Error in ${propertyKey.toString()}: ${error.message}`,
            error
          )
        }
        throw error
      }
    }
    return descriptor
  }
}

export class UniversalToolCache implements ToolCache {
  private highLevelClient: OneGrepApiHighLevelClient

  private connectionManager: ConnectionManager

  private serverNameCache: Cache
  private serverClientCache: Cache
  private toolBasicDetailsCache: Cache

  constructor(
    apiClient: OneGrepApiClient,
    connectionManager: ConnectionManager
  ) {
    this.highLevelClient = new OneGrepApiHighLevelClient(apiClient)

    this.connectionManager = connectionManager

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

    this.toolBasicDetailsCache = createCache({
      cacheId: 'tool-basic-details-cache',
      stores: [
        new Keyv({ ttl: 1000 * 60 * 60 * 24 }) // 1 hours
      ]
    })
  }

  /**
   * Get the name of a tool server (wrapped in TTL cache)
   * @param serverId - The id of the tool server.
   * @returns The name of the tool server.
   */
  private async getServerName(serverId: ToolServerId): Promise<string> {
    return await this.serverNameCache.wrap(serverId, async () => {
      return await this.highLevelClient.getServerName(serverId)
    })
  }

  /**
   * Get the client for a tool server (wrapped in TTL cache)
   * @param serverId - The id of the tool server.
   * @returns The client for the tool server.
   */
  private async getServerClient(
    serverId: ToolServerId
  ): Promise<ToolServerClient> {
    return await this.serverClientCache.wrap(serverId, async () => {
      return await this.highLevelClient.getServerClient(serverId)
    })
  }

  private async convertToolToBasicDetails(
    tool: Tool
  ): Promise<BasicToolDetails> {
    const serverName = await this.getServerName(tool.server_id)
    if (!serverName) {
      log.warn(`Server name not found for tool ${tool.id}`)
      throw new Error(`Server name not found for tool ${tool.id}`)
    }

    return {
      id: tool.id,
      name: tool.name,
      description: tool.description as string,
      serverId: tool.server_id,
      integrationName: serverName as string,
      iconUrl: tool.icon_url as URL | undefined,
      inputSchema: tool.input_schema as JsonSchema
    }
  }

  /**
   * Get the basic details of a tool (wrapped in TTL cache)
   * @param toolId - The id of the tool.
   * @returns The basic details of the tool.
   */
  private async getToolBasicDetails(toolId: ToolId): Promise<BasicToolDetails> {
    return await this.toolBasicDetailsCache.wrap(toolId, async () => {
      const tool: Tool = await this.highLevelClient.getTool(toolId)
      return await this.convertToolToBasicDetails(tool)
    })
  }

  /**
   * Invalidate the basic details cache for a tool
   * @param toolId - The id of the tool.
   */
  private async invalidateToolBasicDetailsCache(toolId: ToolId): Promise<void> {
    await this.toolBasicDetailsCache.del(toolId)
  }

  private createToolDetails(
    basicToolDetails: BasicToolDetails,
    toolResource: ToolResource,
    serverClient: ToolServerClient
  ): ToolDetails {
    const details: ToolDetails = {
      ...basicToolDetails,
      properties: toolResource.properties as ToolProperties,
      policy: toolResource.policy,
      equip: async () => {
        log.trace(`Converting to equipped tool`)
        try {
          const connection = await this.connectionManager.connect(serverClient)
          log.info(
            `Got connection to tool server ${toolResource.tool.server_id}`
          )

          const toolHandle = await connection.getHandle(basicToolDetails)
          log.info(`Got tool handle for ${toolResource.tool.id}`)

          return {
            details,
            handle: new SafeToolHandle(toolHandle)
          }
        } catch (error) {
          log.error(`Error grabbing tool handle: ${error}`)
          throw error
        }
      }
    }
    return details
  }

  private async getToolDetailsBatch(
    toolIds: ToolId[]
  ): Promise<Map<ToolId, ToolDetails>> {
    const toolResources =
      await this.highLevelClient.getToolResourcesBatch(toolIds)

    const toolDetails: Map<ToolId, ToolDetails> = new Map()
    for (const toolId of toolIds) {
      const toolResource = toolResources.get(toolId)
      if (toolResource) {
        const basicToolDetails = await this.getToolBasicDetails(toolId)
        const serverClient = await this.getServerClient(
          toolResource.tool.server_id
        )
        const details = this.createToolDetails(
          basicToolDetails,
          toolResource,
          serverClient
        )
        toolDetails.set(toolId, details)
      }
    }

    return toolDetails
  }

  /**
   * Get the details of a tool
   * @param toolId - The id of the tool.
   * @returns The details of the tool.
   */
  private async getToolDetails(toolId: ToolId): Promise<ToolDetails> {
    const basicToolDetails: BasicToolDetails =
      await this.getToolBasicDetails(toolId)

    log.trace(`Got tool basic details`, basicToolDetails)

    // Getting the ToolResource will get the Properties and Policy for the tool
    const resource: ToolResource =
      await this.highLevelClient.getToolResource(toolId)

    log.trace(`Got tool resource`, resource)

    const serverClient: ToolServerClient = await this.getServerClient(
      resource.tool.server_id
    )

    return this.createToolDetails(basicToolDetails, resource, serverClient)
  }

  @handleErrors()
  async listTools(): Promise<Map<ToolId, BasicToolDetails>> {
    const tools: Tool[] = await this.highLevelClient.listTools()
    log.debug(`Found ${tools.length} tools`)

    const basicTools: Map<ToolId, BasicToolDetails> = new Map()

    for (const t of tools) {
      try {
        const basicToolDetails = await this.getToolBasicDetails(t.id)
        basicTools.set(t.id, basicToolDetails)
      } catch (e) {
        log.warn(`Error fetching tool details for ${t.id}`, e)
        continue
      }
    }

    return basicTools
  }

  @handleErrors()
  async listIntegrations(): Promise<string[]> {
    // TODO: Replace with endpoint which lists integration names
    return await this.highLevelClient.getAllServerNames()
  }

  @handleErrors()
  async clearServerClientCache(): Promise<boolean> {
    /**
     * Clear the server client cache.
     * Returns true if successful, false otherwise.
     */
    this.serverClientCache.clear()
    log.info('Cleared server client cache')
    return true
  }

  @handleErrors()
  async filterTools(
    filterOptions?: FilterOptions
  ): Promise<Map<ToolId, ToolDetails>> {
    log.info(`Filtering tools with options: ${JSON.stringify(filterOptions)}`)
    if (!filterOptions) {
      throw new Error(
        'No filter options provided. If you want to list tools, use the `.listTools()` method.'
      )
    }

    // ! Does not support the full filter options yet
    if (filterOptions.serverIds) {
      throw new Error('Filtering by server ids is not yet supported.')
    }
    if (filterOptions.tools) {
      throw new Error('Filtering by tools is not yet supported.')
    }

    // Filter the tools based on the integration names
    const allTools: Tool[] = await this.highLevelClient.listTools()
    const filteredTools: Tool[] = await Promise.all(
      allTools.map(async (tool) => {
        if (filterOptions.integrationNames) {
          const serverName = await this.getServerName(tool.server_id)
          return filterOptions.integrationNames.includes(serverName)
            ? tool
            : null
        }
        return tool
      })
    ).then((tools) =>
      tools.filter((tool: Tool | null): tool is Tool => tool !== null)
    )

    // Get the details for the filtered tool using the basic details cache
    const result: Map<ToolId, ToolDetails> = new Map()
    for (const tool of filteredTools) {
      const toolDetails = await this.getToolDetails(tool.id)
      result.set(toolDetails.id, toolDetails)
    }

    return result
  }

  @handleErrors()
  async get(toolId: ToolId): Promise<ToolDetails> {
    return await this.getToolDetails(toolId)
  }

  @handleErrors()
  async getMultiple(toolIds: ToolId[]): Promise<Map<ToolId, ToolDetails>> {
    return await this.getToolDetailsBatch(toolIds)
  }

  /**
   * Finds the best toolprint for a given goal (if one exists), and returns a
   * simplified Recommendation object. If no toolprint is found for the goal,
   * it will perform a traditional search and return a list of tools but no
   * prompts in the recommendation.
   *
   * @param goal - The goal to get a recommendation for
   * @returns A recommendation for the goal
   */
  @handleErrors()
  async recommend(goal: string): Promise<Recommendation> {
    try {
      const recommendedToolprint =
        await this.highLevelClient.recommendToolprint(goal)
      const tools: Tool[] = recommendedToolprint.toolprint.tools
      const toolDetails: ToolDetails[] = await Promise.all(
        tools.map(async (tool) => {
          return await this.getToolDetails(tool.id)
        })
      )
      const messages: Prompt[] = recommendedToolprint.prompts

      return {
        goal,
        tools: toolDetails,
        messages
      }
    } catch (_) {
      log.debug(
        `No toolprint found for goal: ${goal}, performing traditional search`
      )
      // If no toolprint is found, perform a traditional search
      const searchResult = await this.search(goal)
      const tools = searchResult.map((result) => result.result)
      return {
        goal,
        tools,
        messages: []
      }
    }
  }

  @handleErrors()
  async search(query: string): Promise<ScoredResult<ToolDetails>[]> {
    log.info(`Searching for tools with query: ${query}`)

    const response: SearchResponseScoredItemTool =
      await this.highLevelClient.searchTools(query)

    const results: ScoredResult<ToolDetails>[] = []

    const toolIds = response.results.map(
      (result: ScoredItemTool) => result.item.id
    )
    const toolDetailsMap = await this.getMultiple(toolIds)

    for (const result of response.results) {
      results.push({
        result: toolDetailsMap.get(result.item.id)!,
        score: result.score
      })
    }

    return results
  }

  @handleErrors()
  async refresh(): Promise<boolean> {
    try {
      log.info('Refreshing toolcache')

      const initResponse: InitializeResponse =
        await this.highLevelClient.initialize()
      log.info(
        `Refresh item counts: servers: ${initResponse.servers.length}, tools: ${initResponse.tools.length}`
      )

      for (const server of initResponse.servers) {
        this.serverNameCache.set(server.id, server.name)
      }
      log.debug(`Set ${initResponse.servers.length} server names in cache`)

      for (const client of initResponse.clients) {
        this.serverClientCache.set(client.server_id, client)
      }
      log.debug(`Set ${initResponse.clients.length} server clients in cache`)

      for (const tool of initResponse.tools) {
        this.toolBasicDetailsCache.set(
          tool.id,
          await this.convertToolToBasicDetails(tool)
        )
      }
      log.debug(`Set ${initResponse.tools.length} tool basic details in cache`)

      return true
    } catch (error) {
      if (error instanceof OneGrepApiError) {
        log.error(
          `Issue with OneGrep API when refreshing toolcache: ${error.message}`
        )
        return false
      }
      throw error
    }
  }

  @handleErrors()
  async refreshTool(toolId: ToolId): Promise<ToolDetails> {
    await this.invalidateToolBasicDetailsCache(toolId)

    return await this.get(toolId)
  }

  @handleErrors()
  async cleanup(): Promise<void> {
    await this.connectionManager.close()
  }
}

/**
 * Create a ToolCache with the specified or default connection manager.
 * @param apiClient - The OneGrepApiClient to use.
 * @param connectionManager - The ConnectionManager to use.
 * @returns A ToolCache.
 */
export async function createToolCache(
  apiClient: OneGrepApiClient,
  connectionManager?: ConnectionManager
) {
  return new UniversalToolCache(
    apiClient,
    connectionManager ?? new ToolServerConnectionManager()
  )
}
