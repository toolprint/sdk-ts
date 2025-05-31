import { ComposioToolServerClient } from '@onegrep/api-client'
import {
  BasicToolDetails,
  ObjectResultContent,
  ToolCallError,
  ToolCallInput,
  ToolCallResponse,
  ToolHandle,
  ToolServerConnection
} from '~/types.js'

import { ActionExecuteResponse, ComposioToolSet } from 'composio-core'
import {
  ClientSession,
  getDopplerSecretManager,
  jsonSchemaUtils,
  mcpCallTool
} from '~/index.js'

import { log } from '~/core/log.js'
import { z } from 'zod'
import { composioToolSet } from './api.js'

export class ComposioToolServerConnection implements ToolServerConnection {
  private toolServerClient: ComposioToolServerClient
  private mcpClientSession: ClientSession | undefined
  private toolSet: ComposioToolSet
  private toolsByName: Map<string, any>

  constructor(
    toolServerClient: ComposioToolServerClient,
    mcpClientSession?: ClientSession
  ) {
    this.toolServerClient = toolServerClient
    this.mcpClientSession = mcpClientSession
    this.toolSet = composioToolSet // ! TODO: inject instead?
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
    // ! TODO: Initialize with Composio SDK?
  }

  async getHandle(toolDetails: BasicToolDetails): Promise<ToolHandle> {
    if (toolDetails.serverId !== this.toolServerClient.server_id) {
      throw new Error(
        `Tool server ID mismatch: ${toolDetails.serverId} !== ${this.toolServerClient.server_id}`
      )
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
      throw new Error('Composio tools do not support sync calls')
    }

    // Call using the Composio SDK's MCP client.
    const call = async (
      toolCallInput: ToolCallInput
    ): Promise<ToolCallResponse<any>> => {
      log.info(
        `Calling composio tool with input: ${JSON.stringify(toolCallInput)}`
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

        const actionExecuteResponse: ActionExecuteResponse =
          await this.toolSet.executeAction({
            action: toolDetails.name,
            params: toolCallInput.args
          })
        if (actionExecuteResponse.error) {
          throw new Error(actionExecuteResponse.error)
        }
        const resultContent: ObjectResultContent = {
          type: 'object',
          data: actionExecuteResponse.data
        }
        return {
          isError: false,
          content: [resultContent],
          mode: 'single',
          toZod: () =>
            z.object({
              result: z.any()
            })
        }
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

    // Call using the Composio SDK's MCP client.
    const callSync = (_: ToolCallInput): ToolCallResponse<any> => {
      // ! TODO: Was having issues with the sync call, so we're not using it yet.
      throw new Error('Composio tools do not support sync calls')
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
      `Closing connection to Composio Server ${this.toolServerClient.server_id}`
    )
    // Only close if we have a direct MCP session
    // When using Composio SDK's MCP client it manages its own sessions.
    if (this.mcpClientSession) {
      await this.mcpClientSession.close()
    }
  }
}

export interface ComposioConnectionOptions {
  apiKey: string
  baseUrl: string
}

export async function createComposioConnection(
  client: ComposioToolServerClient,
  mcpClientSession?: ClientSession
): Promise<ToolServerConnection> {
  // If we've been given a direct session, use it instead of the Composio SDK's.
  if (mcpClientSession) {
    return new ComposioToolServerConnection(client, mcpClientSession)
  }

  // Verify the we can authenticate with Composio and that the workspace matches the tool server's workspace.
  try {
    const secrets = await getDopplerSecretManager()
    const apiKeyPresent = secrets.hasSecret('COMPOSIO_API_KEY')
    if (!apiKeyPresent) {
      throw new Error('Composio API key not found')
    }
  } catch (error) {
    // ! TODO: Warn for now, but we should probably throw an error here when we can reliably validate the Composio function.
    log.warn(
      `Unable to verify Composio authentication for tool server ${client.server_id}`,
      error
    )
  }

  return new ComposioToolServerConnection(client)
}
