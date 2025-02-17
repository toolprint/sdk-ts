import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { ConnectedClient } from './client.js'
import { RemoteToolCallArgs } from './types.js'

export async function toolCall(
  gatewayClient: ConnectedClient,
  args: RemoteToolCallArgs
): Promise<CallToolResult> {
  return await gatewayClient.callTool(args)
}
