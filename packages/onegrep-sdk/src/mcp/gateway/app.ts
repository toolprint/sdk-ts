import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  Server,
  ServerOptions
} from '@modelcontextprotocol/sdk/server/index.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  Implementation
} from '@modelcontextprotocol/sdk/types.js'

import { clientFromConfig } from '../../core/api/client.js'
import { log } from '@repo/utils'

import { EquippedTool, ToolCallInput, ToolCallResponse } from '../../types.js'
import { MCPToolCache } from '../toolcache.js'
import { ConnectedClientManager } from '../client.js'

export const ToolNamespaceDelimiter = '.'

const asGatewayTool = (equippedTool: EquippedTool): Tool => {
  const inputSchema = equippedTool.metadata.inputSchema
  log.info(`Input schema: ${JSON.stringify(inputSchema)}`)
  try {
    return {
      name: `${equippedTool.metadata.integrationName}${ToolNamespaceDelimiter}${equippedTool.metadata.id}`,
      description: equippedTool.metadata.description,
      inputSchema: equippedTool.metadata.inputSchema
    } as Tool
  } catch (error) {
    log.error(`Error creating gateway tool: ${error}`)
    throw error
  }
}

export class Gateway extends McpServer {
  constructor(serverInfo: Implementation, options?: ServerOptions) {
    super(serverInfo, options)
  }
}

export const createGateway = async () => {
  const gatewayServerInfo: Implementation = {
    name: 'Onegrep Gateway',
    version: '1.0.0'
  }
  const gatewayServerOptions: ServerOptions = {
    capabilities: {
      tools: {
        listChanged: true
      }
    }
  }
  const gateway = new Gateway(gatewayServerInfo, gatewayServerOptions)

  const server: Server = gateway.server

  const connectedClientManager = new ConnectedClientManager()
  const mcpToolCache = new MCPToolCache(clientFromConfig())

  // List Tools Handler
  server.setRequestHandler(ListToolsRequestSchema, async (_request) => {
    log.info(`Listing tools`)
    const allToolMetadataMap = await mcpToolCache.metadata()
    const toolResources = Object.values(allToolMetadataMap) as EquippedTool[]
    log.info(`Found ${toolResources.length} tools`)
    const allTools: Tool[] = toolResources.map((resource) =>
      asGatewayTool(resource)
    )
    return { tools: allTools }
  })

  // Call Tool Handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params
    log.info(`Calling tool: ${name}`)

    const [serverName, toolName] = name.split(ToolNamespaceDelimiter)
    if (!serverName || !toolName) {
      throw new Error(`Invalid gateway tool name: ${name}`)
    }

    // TODO: Use Standardize utils for ToolId determination
    // const resourceFilter = AndFilter(
    //   ServerNameFilter(serverName),
    //   ToolNameFilter(toolName)
    // )
    const toolId = `${serverName}::${toolName}`
    const toolResource = (await mcpToolCache.get(toolId)) as
      | EquippedTool
      | undefined
    if (!toolResource) {
      throw new Error(`Tool not found: ${toolId}`)
    }

    log.info(`Calling tool: ${name} from ${serverName}`)

    const toolInput: ToolCallInput = {
      args: args || {},
      approval: undefined
    }

    const result: ToolCallResponse<any> =
      await toolResource.handle.call(toolInput)

    if (result.isError) {
      throw new Error(result.message)
    }

    // TODO: Parse result content
    log.info(`Tool call succeeded`, result)
    return {
      content: result.content
    }
  })

  server.onclose = async () => {
    await connectedClientManager.close()
  }

  return gateway
}
