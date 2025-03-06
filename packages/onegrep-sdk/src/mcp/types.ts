import { schemas } from '@repo/onegrep-api-client'
import {
  CallToolResult,
  CallToolResultSchema,
  McpError
} from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'

export type RemoteClientConfig = z.infer<typeof schemas.RemoteClientConfig>

const RemoteToolCallArgs = z.object({
  toolName: z.string(),
  toolArgs: z.record(z.string(), z.any())
})

export type RemoteToolCallArgs = z.infer<typeof RemoteToolCallArgs>

const RemoteToolCallError = z.object({
  toolName: z.string(),
  toolArgs: z.record(z.string(), z.any()),
  result: CallToolResultSchema,
  mcpError: z.instanceof(McpError)
})

export type RemoteToolCallError = z.infer<typeof RemoteToolCallError>

export interface AsyncToolCall {
  (): Promise<CallToolResult>
}
