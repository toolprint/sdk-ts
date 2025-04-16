import { RemoteClientConfig, RemoteToolCallArgs } from './types.js'
import { ConnectedClientManager } from './client.js'
import {
  CallToolResult,
  Tool as MCPTool
} from '@modelcontextprotocol/sdk/types.js'
import {
  ToolResource,
  JsonSchema,
  ToolMetadata,
  ToolCallInput,
  ToolCallResponse,
  ToolCallError,
  ToolCustomProperties,
  ApiToolResource,
  BasePolicy
} from '../types.js'
import { z } from 'zod'
import { jsonSchemaUtils } from '../schema.js'
import { parseMcpResult } from './toolcall.js'
import { log } from '@repo/utils'

// TODO: Use this as the default output schema if no output schema is provided, but is indicated to be structured output
// const anyObjectJsonSchema = {
//   type: 'object',
//   properties: {},
//   additionalProperties: true
// }

export class McpToolMetadata implements ToolMetadata {
  // Core metadata
  name: string
  description: string
  integrationName: string

  // Schema properties
  inputSchema: JsonSchema
  outputSchema?: JsonSchema

  // Cosmetic properties
  extraProperties?: ToolCustomProperties
  iconUrl?: URL

  private _zodInputType: z.ZodTypeAny
  private _zodOutputType: z.ZodTypeAny

  constructor(
    tool: MCPTool,
    integrationName: string,
    apiToolResource: ApiToolResource,
    inputSchema: JsonSchema,
    outputSchema?: JsonSchema
  ) {
    this.name = tool.name
    this.description = tool.description || 'Tool ' + tool.name
    this.iconUrl = undefined
    this.integrationName = integrationName
    this.extraProperties = apiToolResource.custom_properties as
      | ToolCustomProperties
      | undefined
    this.inputSchema = inputSchema
    this.outputSchema = outputSchema

    this._zodInputType = jsonSchemaUtils.toZodType(inputSchema)
    this._zodOutputType = outputSchema
      ? jsonSchemaUtils.toZodType(outputSchema)
      : z.any()
  }

  zodInputType = (): z.ZodTypeAny => {
    return this._zodInputType
  }

  zodOutputType = (): z.ZodTypeAny => {
    return this._zodOutputType
  }
}

export class MCPToolResource implements ToolResource {
  id: string

  // Core resource properties
  policy: BasePolicy

  // Core tool metadata
  metadata: ToolMetadata

  // Connection manager
  clientConfig: RemoteClientConfig
  connectedClientManager: ConnectedClientManager

  private _outputZodType: z.ZodTypeAny

  constructor(
    id: string,
    metadata: ToolMetadata,
    toolDetails: ApiToolResource,
    clientConfig: RemoteClientConfig,
    connectedClientManager: ConnectedClientManager
  ) {
    this.id = id
    this.metadata = metadata
    this.policy = toolDetails.policy

    this.clientConfig = clientConfig
    this.connectedClientManager = connectedClientManager
    this._outputZodType = metadata.zodOutputType()
  }

  _toolCallArgs(args: Record<string, any>): RemoteToolCallArgs {
    return {
      toolName: this.metadata.name,
      toolArgs: args
    }
  }

  serverName(): string {
    return this.clientConfig.name
  }

  toolName(): string {
    return this.metadata.name
  }

  // TODO: This is a temporary method to set the output schema
  setOutputSchema(outputSchema: JsonSchema): void {
    this.metadata.outputSchema = outputSchema
    this.metadata.zodOutputType = () => jsonSchemaUtils.toZodType(outputSchema)
    this._outputZodType = this.metadata.zodOutputType()
  }

  async callMCP(toolInput: ToolCallInput): Promise<CallToolResult> {
    const connected_client = await this.connectedClientManager.createClient(
      this.clientConfig
    )
    const remoteToolCallArgs = this._toolCallArgs(toolInput.args)
    log.debug(
      `Calling MCP tool with args: ${JSON.stringify(remoteToolCallArgs, null, 2)}`
    )
    const validator = jsonSchemaUtils.getValidator(this.metadata.inputSchema)
    const valid = validator(toolInput.args)
    if (!valid) {
      throw new Error('Invalid tool input arguments')
    }
    log.debug('Before mcp callTool')
    return await connected_client.callTool(remoteToolCallArgs)
  }

  async call(
    toolInput: ToolCallInput
  ): Promise<ToolCallResponse<z.infer<typeof this._outputZodType>>> {
    try {
      const result = await this.callMCP(toolInput)
      return parseMcpResult<z.infer<typeof this._outputZodType>>(
        result,
        this.metadata
      )
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
}

/**
 * Helper function that generates a MCPToolResource from an MCPTool as well as other metadata pertaining to the tool.
 */
export const toolResourceFromMcpTool = (
  tool: MCPTool,
  apiToolResource: ApiToolResource,
  clientConfig: RemoteClientConfig,
  connectedClientManager: ConnectedClientManager
): MCPToolResource => {
  // TODO: Why is this hacky re-parsing of the input schema necessary? Breaks if you try to pass it directly.
  const inputSchemaString = JSON.stringify(tool.inputSchema)
  const inputSchema = JSON.parse(inputSchemaString) as JsonSchema

  // TODO: This should match the Policy ID format
  const id = apiToolResource.id
  const toolMetadata = new McpToolMetadata(
    tool,
    clientConfig.name,
    apiToolResource,
    inputSchema
  )

  return new MCPToolResource(
    id,
    toolMetadata,
    apiToolResource,
    clientConfig,
    connectedClientManager
  )
}
