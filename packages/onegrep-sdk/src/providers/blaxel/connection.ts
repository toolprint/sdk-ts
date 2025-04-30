import { BlaxelToolServerClient } from '../../core/api/types.js'
import {
  BasicToolDetails,
  ToolCallResponse,
  ToolCallError,
  ToolCallInput,
  ToolHandle,
  ToolServerConnection
} from '../../types.js'

import { Function as BlaxelFunction, getFunction } from '@blaxel/sdk'
import {
  McpTool as BlaxelMcpClient,
  retrieveMCPClient
} from '@blaxel/sdk/tools/mcpTool'
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

import { McpCallToolResultContent, parseMcpContent } from '../mcp/toolcall.js'
import { jsonSchemaUtils } from '../../schema.js'

import { log } from '@repo/utils'
import { z } from 'zod'

export class BlaxelToolServerConnection implements ToolServerConnection {
  private toolServerClient: BlaxelToolServerClient
  //   private blaxelFunction: BlaxelFunction
  private mcpClient: BlaxelMcpClient
  private toolNames: Set<string>

  constructor(toolServerClient: BlaxelToolServerClient, _: BlaxelFunction) {
    this.toolServerClient = toolServerClient
    // this.blaxelFunction = blaxelFunction // ! Not used?
    this.mcpClient = retrieveMCPClient(toolServerClient.blaxel_function)
    this.toolNames = new Set<string>()
  }

  async initialize(): Promise<void> {
    await this.mcpClient.refresh()
    log.info(`Refreshed blaxel MCP server`)
    const tools = await this.mcpClient.listTools()
    log.info(`Found ${tools.length} tools on blaxel MCP server`)
    this.toolNames = new Set(tools.values().map((tool) => tool.name))
  }

  async getHandle(toolDetails: BasicToolDetails): Promise<ToolHandle> {
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
        `Calling blaxel tool with input: ${JSON.stringify(toolCallInput)}`
      )
      try {
        const validator = jsonSchemaUtils.getValidator(toolDetails.inputSchema)
        const valid = validator(toolCallInput.args)
        if (!valid) {
          throw new Error('Invalid tool input arguments')
        }
        const result = (await this.mcpClient.call(
          toolDetails.name,
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
  }

  async close(): Promise<void> {
    log.info(
      `Closing connection to Blaxel Server ${this.toolServerClient.server_id}`
    )
    return this.mcpClient.close()
  }
}

export async function createBlaxelConnection(
  client: BlaxelToolServerClient
): Promise<ToolServerConnection> {
  const { data, error } = await getFunction({
    path: {
      functionName: client.blaxel_function
    }
  })
  if (error !== undefined) {
    throw new Error(`Error getting function: ${error}`)
  }
  if (data === undefined) {
    throw new Error(`Function not found: ${client.blaxel_function}`)
  }
  const instance = new BlaxelToolServerConnection(client, data)
  await instance.initialize()
  return instance
}
