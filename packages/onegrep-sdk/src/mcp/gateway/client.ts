import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { log } from '../../logger.js'
import { createClientTransport } from './transport.js'
import { RemoteClientConfig, RemoteToolCallArgs } from './types.js'
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
  callTool: (args: RemoteToolCallArgs) => Promise<CallToolResult>
  cleanup: () => Promise<void>
}

export const createConnectedClient = async (
  remoteClientConfig: RemoteClientConfig
) => {
  const transport = createClientTransport(remoteClientConfig)
  log.debug(`Transport created for ${remoteClientConfig.name}`, transport)

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

  try {
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
      callTool: async (args: RemoteToolCallArgs) => {
        const callToolRequest: CallToolRequest = {
          method: 'tools/call',
          params: {
            name: args.toolName,
            arguments: args.toolArgs
          }
        }
        log.debug(`Calling tool: ${JSON.stringify(callToolRequest)}`)
        const result = await client.callTool(callToolRequest.params)
        if (result.isError) {
          log.error(`Tool call failed result: ${JSON.stringify(result)}`)
          throw new Error('Tool call failed')
        }
        return result as CallToolResult
      },
      cleanup: async () => {
        await transport.close()
      }
    } as ConnectedClient
  } catch (error) {
    log.error(`Failed to connect to ${remoteClientConfig.name}:`, error)
  }
}
