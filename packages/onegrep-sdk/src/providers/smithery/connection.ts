import { SmitheryToolServerClient } from '../../core/api/types.js'
import {
  BasicToolDetails,
  ToolCallError,
  ToolCallInput,
  ToolCallResponse,
  ToolHandle,
  ToolServerConnection
} from '../../types.js'
import { z } from 'zod'

import { jsonSchemaUtils } from '../../schema.js'
import {
  parseMcpContent,
  McpCallToolResultContent
} from '../../providers/mcp/toolcall.js'

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import {
  CallToolRequest,
  CallToolResult
} from '@modelcontextprotocol/sdk/types.js'

import { log } from '@repo/utils'

import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

import { createSmitheryUrl } from '@smithery/sdk'
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'

/*
 * A connection to a Smithery tool server using HTTP Streaming transport
 */
export class SmitheryToolServerConnection implements ToolServerConnection {
  private toolServerClient: SmitheryToolServerClient
  private mcpClient: Client
  private toolNames: Set<string>

  constructor(toolServerClient: SmitheryToolServerClient) {
    this.toolServerClient = toolServerClient
    this.mcpClient = new Client({
      name: 'OneGrep SDK',
      version: '1.0.0' // ! Version?
    })
    this.toolNames = new Set<string>()
  }

  private getTransport(): Transport {
    // ! TODO: Move to sdk initialization to prevent late binding issues?
    const smitheryApiKey = process.env.SMITHERY_API_KEY
    if (!smitheryApiKey) {
      throw new Error(
        'SMITHERY_API_KEY environment variable is required for Smithery connections'
      )
    }

    // Smithery is moving to prioritize http-streaming transport
    const http_connection = this.toolServerClient.connections.find(
      (c) => c.type === 'http'
    )
    if (!http_connection) {
      throw new Error('No HTTP connection found')
    }
    if (!http_connection.deployment_url) {
      throw new Error('No deployment URL found')
    }

    // ! TODO: Parse and validate config
    const config = {
      env: {}
    }

    // NOTE: do not log the smithery_transport_url as it contains the api key
    const smithery_transport_url = createSmitheryUrl(
      http_connection.deployment_url,
      config,
      smitheryApiKey
    )
    return new StreamableHTTPClientTransport(smithery_transport_url)
  }

  async initialize(): Promise<void> {
    const transport = this.getTransport()
    await this.mcpClient.connect(transport)
    log.info(`Connected to Smithery server: ${this.toolServerClient.server_id}`)

    const tools = await this.mcpClient.listTools().then((tools) => tools.tools)
    log.info(
      `Found ${tools.length} tools on server: ${this.toolServerClient.server_id}`
    )
    this.toolNames = new Set(tools.map((t) => t.name))
  }

  async getHandle(toolDetails: BasicToolDetails): Promise<ToolHandle> {
    log.info(`Getting handle for tool: ${toolDetails.name}`, toolDetails)
    if (toolDetails.serverId !== this.toolServerClient.server_id) {
      throw new Error(
        `Tool server ID mismatch: ${toolDetails.serverId} !== ${this.toolServerClient.server_id}`
      )
    }

    if (!this.toolNames.has(toolDetails.name)) {
      throw new Error(`Tool not found: ${toolDetails.name}`)
    }

    // TODO: How to determine the output type?
    const parseResultFunc = (result: CallToolResult): ToolCallResponse<any> => {
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
        `Calling Smithery tool ${toolDetails.name} with input ${JSON.stringify(toolCallInput)}`
      )
      try {
        const validator = jsonSchemaUtils.getValidator(toolDetails.inputSchema)
        const valid = validator(toolCallInput.args)
        if (!valid) {
          throw new Error('Invalid tool input arguments')
        }
        const callToolRequest: CallToolRequest = {
          method: 'tools/call',
          params: {
            name: toolDetails.name,
            arguments: toolCallInput.args
          }
        }
        const result = await this.mcpClient.callTool(callToolRequest.params)
        if (result.isError) {
          log.error(`Tool call failed result: ${JSON.stringify(result)}`)
          throw new Error('Tool call failed')
        }
        return parseResultFunc(result as CallToolResult)
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
      throw new Error('Smithery tools do not support sync calls')
    }

    return {
      call: (input: ToolCallInput) => call(input),
      callSync: (input: ToolCallInput) => callSync(input)
    }
  }

  async close(): Promise<void> {
    return Promise.resolve()
  }
}

export async function createSmitheryConnection(
  client: SmitheryToolServerClient
): Promise<ToolServerConnection> {
  const instance = new SmitheryToolServerConnection(client)
  await instance.initialize()
  return instance
}
