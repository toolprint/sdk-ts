import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { log } from '@repo/utils'
import { createSSEClientTransport } from './transport/sse.js'
import { McpToolCallError, McpToolCallInput } from './types.js'
import { RemoteClientConfig } from '../../core/api/types.js'
import {
  CallToolRequest,
  CallToolResult,
  ListToolsResult,
  Tool
} from '@modelcontextprotocol/sdk/types.js'

export interface ConnectedClient {
  name: string
  client: Client

  listTools: () => Promise<Tool[]>
  callTool: (args: McpToolCallInput) => Promise<CallToolResult>
  close: () => Promise<void>
}

export class ConnectedClientManager {
  private clients: Map<string, ConnectedClient> = new Map<
    string,
    ConnectedClient
  >()

  private apiKey: string | undefined
  private ignoreReadyCheck: boolean = true // TODO: enforce

  async createClient(clientConfig: RemoteClientConfig) {
    try {
      const client = await createConnectedClient(
        clientConfig,
        this.apiKey,
        this.ignoreReadyCheck
      )
      this.clients.set(clientConfig.name, client)
      return client
    } catch (error) {
      log.error(`Failed to connect to ${clientConfig.name}:`, error)
      throw error
    }
  }

  async getClient(clientConfig: RemoteClientConfig) {
    if (!this.clients.has(clientConfig.name)) {
      const client = await this.createClient(clientConfig)
      this.clients.set(clientConfig.name, client)
    }
    return this.clients.get(clientConfig.name)
  }

  async close(): Promise<void> {
    const allClients = Array.from(this.clients.values())
    await Promise.all(allClients.map(({ close }) => close()))
  }
}

const createConnectedClient = async (
  remoteClientConfig: RemoteClientConfig,
  apiKey: string | undefined,
  ignoreReadyCheck: boolean = false
) => {
  if (!apiKey) {
    apiKey = process.env.ONEGREP_API_KEY
  }
  if (!apiKey) {
    log.warn(
      `No API key provided, if policy checks are enabled, tools will not be available`
    )
  }

  const transport = createSSEClientTransport(
    remoteClientConfig,
    apiKey,
    ignoreReadyCheck
  )
  log.debug(`SSE Transport created for ${remoteClientConfig.name}`)

  const client = new Client(
    {
      name: 'onegrep-mcp-gateway-client',
      version: '1.0.0' // TODO: get version from package.json
    },
    {
      capabilities: {
        prompts: {},
        resources: { subscribe: true },
        tools: {}
      }
    }
  )

  await client.connect(transport)
  log.info(`Connected to server: ${remoteClientConfig.name}`)

  return {
    client,
    name: remoteClientConfig.name,
    listTools: async () => {
      const tools: ListToolsResult = await client.listTools()
      if (tools.isError) {
        throw new Error('Failed to list tools')
      }
      return tools.tools
    },
    callTool: async (toolCallInput: McpToolCallInput) => {
      const callToolRequest: CallToolRequest = {
        method: 'tools/call',
        params: {
          name: toolCallInput.toolName,
          arguments: toolCallInput.toolArgs
        }
      }
      log.debug(`Calling tool: ${JSON.stringify(callToolRequest)}`)
      try {
        const result = await client.callTool(callToolRequest.params)
        if (result.isError) {
          log.error(`Tool call failed result: ${JSON.stringify(result)}`)
          throw new Error('Tool call failed')
        }
        return result as CallToolResult
      } catch (error) {
        throw new McpToolCallError(
          toolCallInput,
          `Failed to call tool ${toolCallInput.toolName}`,
          { cause: error }
        )
      }
    },
    close: async () => {
      await transport.close()
    }
  } as ConnectedClient
}
