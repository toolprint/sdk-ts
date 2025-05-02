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

import {
  BasicToolDetails,
  clientFromConfig,
  createToolbox,
  ToolDetails
} from '@onegrep/sdk'

import { ToolCallInput, ToolCallResponse } from '@onegrep/sdk'

import { log } from './log.js'

export const ToolNamespaceDelimiter = '.'

const asGatewayTool = (toolDetails: BasicToolDetails): Tool => {
  const inputSchema = toolDetails.inputSchema
  log.info(`Input schema: ${JSON.stringify(inputSchema)}`)
  try {
    return {
      name: `${toolDetails.integrationName}${ToolNamespaceDelimiter}${toolDetails.id}`,
      description: toolDetails.description,
      inputSchema: toolDetails.inputSchema
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

  // Create the toolbox first (fail fast if there's an issue)
  const toolbox = await createToolbox(clientFromConfig())

  const gateway = new Gateway(gatewayServerInfo, gatewayServerOptions)

  const server: Server = gateway.server

  // List Tools Handler
  server.setRequestHandler(ListToolsRequestSchema, async (_request) => {
    log.info(`Listing tools`)
    const allToolMetadataMap = await toolbox.listTools()
    const toolResources = Object.values(
      allToolMetadataMap
    ) as BasicToolDetails[]
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
    const toolId = `${serverName}::${toolName}` // ! TODO: Broken!
    const toolDetails = (await toolbox.get(toolId)) as ToolDetails | undefined
    if (!toolDetails) {
      throw new Error(`Tool not found: ${toolId}`)
    }

    const equippedTool = await toolDetails.equip()

    log.info(`Calling tool: ${name} from ${serverName}`)

    const toolInput: ToolCallInput = {
      args: args || {},
      approval: undefined
    }

    const result: ToolCallResponse<any> =
      await equippedTool.handle.call(toolInput)

    if (result.isError) {
      throw new Error(result.message)
    }

    // TODO: Parse result content
    log.info(`Tool call succeeded`, result)
    return {
      content: 'TODO: Parse result content' // ! TODO: Parse result content
    }
  })

  server.onclose = async () => {
    await toolbox.close()
  }

  return gateway
}
