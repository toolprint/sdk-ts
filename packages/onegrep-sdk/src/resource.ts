import { toolCall } from './mcp/gateway/toolcall.js'
import {
  ToolMetadata,
  toolMetadataFromTool
} from './mcp/gateway/toolmetadata.js'
import { RemoteToolCallArgs } from './mcp/gateway/types.js'
import { ConnectedClient } from './mcp/gateway/client.js'
import { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js'
import { log } from '@repo/utils'
import { JsonSchema, jsonSchemaToZod } from 'json-schema-to-zod'

export class ToolResource {
  id: string
  toolMetadata: ToolMetadata
  gatewayClient: ConnectedClient

  constructor(
    id: string,
    toolMetadata: ToolMetadata,
    gatewayClient: ConnectedClient
  ) {
    this.id = id
    this.toolMetadata = toolMetadata
    this.gatewayClient = gatewayClient
  }

  _remoteToolCallArgs(args: Record<string, any>): RemoteToolCallArgs {
    return {
      toolName: this.toolMetadata.name,
      toolArgs: args
    }
  }

  serverName(): string {
    return this.gatewayClient.name
  }

  toolName(): string {
    return this.toolMetadata.name
  }

  async callTool(args: Record<string, any>): Promise<CallToolResult> {
    const remoteToolCallArgs = this._remoteToolCallArgs(args)
    log.debug(`Making tool call: ${JSON.stringify(remoteToolCallArgs)}`)
    return await toolCall(this.gatewayClient, remoteToolCallArgs)
  }
}

export const toolResourceFromTool = (
  tool: Tool,
  gatewayClient: ConnectedClient
) => {
  // TODO: Why is this hacky re-parsing of the input schema necessary? Breaks if you try to pass it directly.
  const inputSchemaString = JSON.stringify(tool.inputSchema)
  // log.debug(`inputSchemaString: ${inputSchemaString}`)
  const inputSchema = JSON.parse(inputSchemaString) as JsonSchema
  // log.debug(`inputSchema re parsed: ${JSON.stringify(inputSchema)}`)

  const id = `${gatewayClient.name}::${tool.name}`
  const toolMetadata = toolMetadataFromTool(tool, inputSchema)
  return new ToolResource(id, toolMetadata, gatewayClient)
}

export const toolResourcesFromClient = (client: ConnectedClient) => {
  return client.listTools().then((tools) => {
    return tools.map((tool) => toolResourceFromTool(tool, client))
  })
}
