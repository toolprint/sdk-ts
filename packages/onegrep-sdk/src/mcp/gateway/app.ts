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
  Implementation
} from '@modelcontextprotocol/sdk/types.js'

import { clientFromConfig } from '../../client.js'
import {
  AndFilter,
  createToolbox,
  ServerNameFilter,
  ToolNameFilter
} from '../../toolbox.js'
import { ToolResource } from '../../resource.js'
import { log } from '@repo/utils'
import { z } from 'zod'

export const ToolNamespaceDelimiter = '_TOOL_'

const asGatewayTool = (toolResource: ToolResource): Tool => {
  const inputSchema = toolResource.toolMetadata.inputSchema
  log.info(`Input schema: ${JSON.stringify(inputSchema)}`)
  try {
    return {
      name: `${toolResource.serverName()}${ToolNamespaceDelimiter}${toolResource.toolName()}`,
      description: toolResource.toolMetadata.description,
      inputSchema: toolResource.toolMetadata.inputSchema
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

  const toolbox = await createToolbox(clientFromConfig())

  // List Tools Handler
  server.setRequestHandler(ListToolsRequestSchema, async (request) => {
    log.info(`Listing tools`)
    const toolResources = await toolbox.getToolResources()
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

    const resourceFilter = AndFilter(
      ServerNameFilter(serverName),
      ToolNameFilter(toolName)
    )
    const toolResource = await toolbox.matchUniqueToolResource(resourceFilter)

    log.info(`Calling tool: ${name} from ${serverName}`)

    const result = await toolResource.callTool(args || {})
    log.info(`Tool call succeeded`)
    return result
  })

  server.onclose = async () => {
    await toolbox.cleanup()
  }

  return gateway
}
