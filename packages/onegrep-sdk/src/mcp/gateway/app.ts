import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  Server,
  ServerOptions
} from '@modelcontextprotocol/sdk/server/index.js'
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  Tool,
  ListToolsResultSchema,
  ListPromptsResultSchema,
  ListResourcesResultSchema,
  ReadResourceResultSchema,
  ListResourceTemplatesRequestSchema,
  ListResourceTemplatesResultSchema,
  ResourceTemplate,
  CompatibilityCallToolResultSchema,
  GetPromptResultSchema,
  Implementation,
  CallToolResult
} from '@modelcontextprotocol/sdk/types.js'

import { clientFromConfig } from '../../client.js'
import {
  AndFilter,
  createToolbox,
  ServerNameFilter,
  ToolNameFilter
} from '../../toolbox.js'
import { MCPToolResource } from '../resource.js'
import { log } from '@repo/utils'
import { z } from 'zod'
import { ToolCallInput, ToolResource } from '../../types.js'
import { MCPToolCache } from '../toolcache.js'
import { ConnectedClientManager } from '../client.js'

export const ToolNamespaceDelimiter = '_TOOL_'

const asGatewayTool = (toolResource: MCPToolResource): Tool => {
  const inputSchema = toolResource.metadata.inputSchema
  log.info(`Input schema: ${JSON.stringify(inputSchema)}`)
  try {
    return {
      name: `${toolResource.serverName()}${ToolNamespaceDelimiter}${toolResource.toolName()}`,
      description: toolResource.metadata.description,
      inputSchema: toolResource.metadata.inputSchema
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
  const mcpToolCache = new MCPToolCache(
    clientFromConfig(),
    connectedClientManager
  )

  // List Tools Handler
  server.setRequestHandler(ListToolsRequestSchema, async (request) => {
    log.info(`Listing tools`)
    const toolResources = (await mcpToolCache.list()) as MCPToolResource[] // Cast to MCPToolResource[]
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
      | MCPToolResource
      | undefined
    if (!toolResource) {
      throw new Error(`Tool not found: ${toolId}`)
    }

    log.info(`Calling tool: ${name} from ${serverName}`)

    const toolInput: ToolCallInput = {
      args: args || {},
      approval: undefined
    }

    const result: CallToolResult = await toolResource.callMCP(toolInput)
    log.info(`Tool call succeeded`)
    return result
  })

  server.onclose = async () => {
    await connectedClientManager.close()
  }

  return gateway
}
