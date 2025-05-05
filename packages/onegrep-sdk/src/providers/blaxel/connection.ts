import {
  BasicToolDetails,
  ToolCallResponse,
  ToolCallInput,
  ToolHandle,
  ToolServerConnection,
  ToolCallError
} from '~/types.js'
import { jsonSchemaUtils } from '~/schema.js'
import { parseResultFunc } from '~/providers/mcp/toolcall.js'

import { BlaxelToolServerClient } from '~/core/index.js'

import { getTool as getBlaxelServerTools } from '@blaxel/sdk'
import { settings as blaxelSettings } from '@blaxel/sdk'

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

import { log } from '~/core/log.js'

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
  private toolsByName: Map<string, BlaxelTool>

  constructor(toolServerClient: BlaxelToolServerClient) {
    this.toolServerClient = toolServerClient
    this.toolsByName = new Map()
  }

  async initialize(): Promise<void> {
    // ! For now the Blaxel Function name is the same as the integration name.
    const tools = await getBlaxelServerTools(
      this.toolServerClient.blaxel_function
    )
    log.info(`Found ${tools.length} tools on blaxel MCP server`)

    this.toolsByName = new Map(tools.map((tool) => [tool.name, tool]))
  }

  private get toolNames(): Set<string> {
    return new Set(this.toolsByName.keys())
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
    // ! No need to close the Blaxel MCP client manually, it manages its own sessions.
  }
}

export async function createBlaxelConnection(
  client: BlaxelToolServerClient
): Promise<ToolServerConnection> {
  // NOTE: Using the Blaxel SDK to retrieve their MCP client
  // will automatically use their auth mechanism pulling from the environment.
  // This is not currently easy to override, so it is important to ensure Blaxel is authenticated
  // and the current workspace matches the tool server's workspace.
  try {
    blaxelSettings.authenticate()
  } catch (error) {
    log.error(
      `Blaxel authentication failed in connection attempt for tool server ${client.server_id}`,
      error
    )
    throw new Error('Failed to authenticate with Blaxel', { cause: error })
  }
  const workspace = blaxelSettings.workspace
  if (!workspace) {
    log.error(
      `Blaxel workspace not found in connection attempt for tool server ${client.server_id}`
    )
    throw new Error('Blaxel workspace not found')
  }

  if (workspace !== client.blaxel_workspace) {
    log.error(
      `Configured Blaxel workspace does not match requested workspace: ${workspace} !== ${client.blaxel_workspace}`
    )
    throw new Error(
      `Incorrect Blaxel workspace: ${workspace} !== ${client.blaxel_workspace}`
    )
  }
  const instance = new BlaxelToolServerConnection(client)
  await instance.initialize()
  return instance
}
