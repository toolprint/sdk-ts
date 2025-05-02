import { z } from 'zod'

import { schemas } from '@repo/onegrep-api-client'

// Export types from the generated API client for use in the high-level API client

export type InitializeResponse = z.infer<typeof schemas.InitializeResponse>

export type AccountInformation = z.infer<typeof schemas.AccountInformation>

export type ToolServerProvider = z.infer<typeof schemas.ToolServerProvider>
export type ToolServer = z.infer<typeof schemas.ToolServer>

export type MCPToolServerClient = z.infer<typeof schemas.MCPToolServerClient>
export type BlaxelToolServerClient = z.infer<
  typeof schemas.BlaxelToolServerClient
>
export type SmitheryToolServerClient = z.infer<
  typeof schemas.SmitheryToolServerClient
>

export type ToolServerClient =
  | MCPToolServerClient
  | BlaxelToolServerClient
  | SmitheryToolServerClient

export type Tool = z.infer<typeof schemas.Tool>
export type ToolProperties = z.infer<typeof schemas.ToolProperties>

export type ToolResource = z.infer<typeof schemas.ToolResource>
export type Policy = z.infer<typeof schemas.Policy>

export type SearchResponseScoredItemTool = z.infer<
  typeof schemas.SearchResponse_ScoredItem_Tool__
>
export type SearchResponseScoredItemRecipe = z.infer<
  typeof schemas.SearchResponse_ScoredItem_Recipe__
>

export type SearchResponse =
  | SearchResponseScoredItemTool
  | SearchResponseScoredItemRecipe

export type RemoteClientConfig = z.infer<typeof schemas.RemoteClientConfig>
