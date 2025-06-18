import { ClientSession } from '~/providers/mcp/session.js'
import { mcpCallTool, parseResultFunc } from '~/providers/mcp/toolcall.js'
import { jsonSchemaUtils } from '~/schema.js'
import {
  BasicToolDetails,
  ToolCallError,
  ToolCallInput,
  ToolCallResponse,
  ToolHandle,
  ToolServerConnection
} from '~/types.js'

import { BlaxelToolServerClient } from '@toolprint/api-client'

import { Function, getTool as getBlaxelServerTools } from '@blaxel/core'

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

import { log } from '~/core/log.js'
import { getDopplerSecretManager } from '~/secrets/doppler.js'
import {
  getBlaxelFunction,
  initializeBlaxelApiClientFromSecrets
} from './api.js'

/**
 * A tool from the Blaxel MCP server.
 *
 * ! Blaxel doesn't export the Tool type, so we're using this simplified version.
 */
interface BlaxelTool {
  name: string
  description: string
  call(input: unknown): Promise<unknown>
}

/**
 * A connection to a Blaxel tool server.
 *
 * Delegates to the Blaxel MCP client cache for ClientSession management rather than ours.
 *
 * TODO: Consider using our own ClientSessionManager for Blaxel MCP clients if they can give us Transport instances.
 */
export class BlaxelToolServerConnection implements ToolServerConnection {
  private toolServerClient: BlaxelToolServerClient
  private mcpClientSession: ClientSession | undefined
  private toolsByName: Map<string, BlaxelTool>

  constructor(
    toolServerClient: BlaxelToolServerClient,
    mcpClientSession?: ClientSession
  ) {
    this.toolServerClient = toolServerClient
    this.mcpClientSession = mcpClientSession
    this.toolsByName = new Map()
  }

  /**
   * Whether we should use a direct connection to the Blaxel MCP server.
   *
   * If we have a direct session, we should use it.
   * If we don't have a direct session, we should use the Blaxel SDK's MCP client.
   */
  private get useDirectConnection(): boolean {
    return this.mcpClientSession !== undefined
  }

  async initialize(): Promise<void> {
    // If we don't have a direct session, we should get register the BlaxelTools
    if (!this.useDirectConnection) {
      // ! For now the Blaxel Function name is the same as the integration name.
      const tools = await getBlaxelServerTools(
        this.toolServerClient.blaxel_function
      )
      this.toolsByName = new Map(tools.map((tool) => [tool.name, tool]))
      log.debug(`Registered ${this.registeredToolNames.size} blaxel tools`)
    }
  }

  private get registeredToolNames(): Set<string> {
    return new Set(this.toolsByName.keys())
  }

  async getHandle(toolDetails: BasicToolDetails): Promise<ToolHandle> {
    if (toolDetails.serverId !== this.toolServerClient.server_id) {
      throw new Error(
        `Tool server ID mismatch: ${toolDetails.serverId} !== ${this.toolServerClient.server_id}`
      )
    }

    // Only try to validate the tool name if we're using the Blaxel SDK's MCP client.
    if (!this.useDirectConnection) {
      if (!this.registeredToolNames.has(toolDetails.name)) {
        throw new Error(`Tool not found: ${toolDetails.name}`)
      }
    }

    // Call using our own MCP client.
    const callDirect = async (
      toolCallInput: ToolCallInput
    ): Promise<ToolCallResponse<any>> => {
      return await mcpCallTool(
        this.mcpClientSession!.client,
        toolDetails,
        toolCallInput
      )
    }

    // Call using our own MCP client.
    const callSyncDirect = (_: ToolCallInput): ToolCallResponse<any> => {
      throw new Error('Blaxel tools do not support sync calls')
    }

    // Call using the Blaxel SDK's MCP client.
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
        const tool = this.toolsByName.get(toolDetails.name)
        if (!tool) {
          throw new Error(`Tool not found: ${toolDetails.name}`)
        }

        const result = (await tool.call(toolCallInput.args)) as CallToolResult // ! Why does blaxel not return a CallToolResult type?
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

    // Call using the Blaxel SDK's MCP client.
    const callSync = (_: ToolCallInput): ToolCallResponse<any> => {
      throw new Error('Blaxel tools do not support sync calls')

      // ! TODO: Was having issues with the sync call, so we're not using it yet.
      // log.info(`Calling blaxel tool with input: ${JSON.stringify(toolCallInput)}`);
      // const result: CallToolResult = toolServer.call(toolCallInput.name, toolCallInput.args);
      // return parseResultFunc(result);
    }

    if (this.useDirectConnection) {
      return {
        call: callDirect.bind(this),
        callSync: callSyncDirect.bind(this)
      }
    } else {
      return {
        call: call.bind(this),
        callSync: callSync.bind(this)
      }
    }
  }

  async close(): Promise<void> {
    log.info(
      `Closing connection to Blaxel Server ${this.toolServerClient.server_id}`
    )
    // Only close if we have a direct MCP session
    // When using Blaxel SDK's MCP client it manages its own sessions.
    if (this.mcpClientSession) {
      await this.mcpClientSession.close()
    }
  }
}

export async function createBlaxelConnection(
  client: BlaxelToolServerClient,
  mcpClientSession?: ClientSession
): Promise<ToolServerConnection> {
  // If we've been given a direct session, use it instead of the Blaxel SDK's.
  if (mcpClientSession) {
    return new BlaxelToolServerConnection(client, mcpClientSession)
  }

  // Verify the we can authenticate with Blaxel and that the workspace matches the tool server's workspace.
  try {
    await initializeBlaxelApiClientFromSecrets(await getDopplerSecretManager())
    const blaxelFunction: Function = await getBlaxelFunction(
      client.blaxel_function
    )

    if (!blaxelFunction) {
      throw new Error(
        `Blaxel function not found using provided authentication: ${client.blaxel_function}`
      )
    }

    log.debug(
      `Blaxel function found for tool server ${client.server_id}: ${client.blaxel_function}`,
      blaxelFunction
    )
  } catch (error) {
    // ! TODO: Warn for now, but we should probably throw an error here when we can reliably validate the Blaxel function.
    log.warn(
      `Unable to verify Blaxel authentication for tool server ${client.server_id}`,
      error
    )
  }

  return new BlaxelToolServerConnection(client)
}
