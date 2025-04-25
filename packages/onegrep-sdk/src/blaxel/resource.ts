import {
  ApiToolResource,
  Policy,
  JsonSchema,
  ToolCallError,
  ToolCallInput,
  ToolCallResponse,
  ToolProperties,
  ToolId,
  ToolMetadata,
  ToolResource
} from 'types.js'
import { Tool as BlaxelTool } from '@blaxel/sdk/tools/types'
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import { parseMcpResult } from '../mcp/toolcall.js'
import { BlaxelClient } from './client.js'
import { jsonSchemaUtils } from '../schema.js'

export class BlaxelToolMetadata implements ToolMetadata {
  // Blaxel metadata
  blaxelServerName: string
  blaxelToolName: string

  // Core metadata
  name: string
  description: string
  integrationName: string

  // Schema properties
  inputSchema: JsonSchema
  outputSchema?: JsonSchema

  // Cosmetic properties
  extraProperties?: ToolProperties
  iconUrl?: URL

  _zodInputType: z.ZodTypeAny
  _zodOutputType: z.ZodTypeAny

  constructor(
    blaxelServerName: string,
    blaxelTool: BlaxelTool,
    apiToolResource: ApiToolResource
  ) {
    this.blaxelToolName = blaxelTool.name
    this.blaxelServerName = blaxelServerName

    this.name = apiToolResource.tool_name
    this.description = blaxelTool.description
    if (
      apiToolResource.description !== null &&
      apiToolResource.description !== undefined
    ) {
      this.description = apiToolResource.description as string
    }
    this.integrationName = apiToolResource.integration_name

    // Safety checks for consistency between the blaxel server and the tool metadata we are retrieving.
    if (this.blaxelServerName !== apiToolResource.integration_name) {
      throw new Error(
        `Blaxel server name ${this.blaxelServerName} does not match integration name ${apiToolResource.integration_name}`
      )
    }

    if (this.blaxelToolName !== apiToolResource.tool_name) {
      throw new Error(
        `Blaxel tool name ${this.blaxelToolName} does not match tool name ${apiToolResource.tool_name}`
      )
    }

    this.inputSchema = blaxelTool.inputSchema
    this.outputSchema = undefined
    this._zodInputType = jsonSchemaUtils.toZodType(blaxelTool.inputSchema)
    this._zodOutputType = z.any()

    this.extraProperties = apiToolResource.properties as
      | ToolProperties
      | undefined
  }

  setOutputSchema(_: JsonSchema): void {
    // TODO: Nothing to implement here yet.
    return
  }

  zodInputType(): z.ZodTypeAny {
    return this._zodInputType
  }

  zodOutputType(): z.ZodTypeAny {
    return this._zodOutputType
  }
}

export class BlaxelToolResource implements ToolResource {
  id: ToolId
  metadata: ToolMetadata
  policy: Policy

  private blaxelClient: BlaxelClient
  private blaxelMcpServerName: string
  private tool: BlaxelTool
  private _outputZodType: z.ZodTypeAny

  constructor(
    blaxelClient: BlaxelClient,
    blaxelServerName: string,
    blaxelTool: BlaxelTool,
    apiToolResource: ApiToolResource
  ) {
    this.blaxelClient = blaxelClient
    this.blaxelMcpServerName = blaxelServerName
    this.metadata = new BlaxelToolMetadata(
      blaxelServerName,
      blaxelTool,
      apiToolResource
    )

    this.policy = apiToolResource.policy
    this.id = apiToolResource.id
    this.tool = blaxelTool

    this._outputZodType = this.metadata.zodOutputType()
  }

  setOutputSchema(_: JsonSchema): void {
    return
  }

  async refresh(): Promise<void> {
    await this.blaxelClient.refreshIntegration(this.blaxelMcpServerName)
  }

  async call(
    input: ToolCallInput
  ): Promise<ToolCallResponse<z.infer<typeof this._outputZodType>>> {
    try {
      const result = (await this.tool.call(input.args)) as CallToolResult
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
