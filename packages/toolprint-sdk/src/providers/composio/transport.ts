import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { ComposioToolServerClient } from '@onegrep/api-client'

export function createComposioTransports(
  toolServerClient: ComposioToolServerClient
): Transport[] {
  const mcpServerUrl = new URL(toolServerClient.mcp_url)
  if (!mcpServerUrl) {
    throw new Error('Composio MCP server not found')
  }
  return [new SSEClientTransport(mcpServerUrl)]
}
