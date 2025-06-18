import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { ComposioToolServerClient } from '../../../../toolprint-api-client/dist/types/src/index.js'

export function createComposioTransports(
  toolServerClient: ComposioToolServerClient
): Transport[] {
  const mcpServerUrl = new URL(toolServerClient.mcp_url)
  if (!mcpServerUrl) {
    throw new Error('Composio MCP server not found')
  }
  return [new SSEClientTransport(mcpServerUrl)]
}
