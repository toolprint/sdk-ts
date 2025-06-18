import {
  BlaxelToolServerClient,
  client,
  ComposioToolServerClient,
  McpToolServerClient,
  SmitheryToolServerClient
} from '@toolprint/api-client'

export type OneGrepApiClient = typeof client

export type ToolServerClient =
  | McpToolServerClient
  | BlaxelToolServerClient
  | SmitheryToolServerClient
  | ComposioToolServerClient
