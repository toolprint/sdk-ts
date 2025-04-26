import { schemas } from '@repo/onegrep-api-client'
import { z } from 'zod'

// Export types from the generated API client for use in the high-level API client

export type ToolServerProvider = z.infer<typeof schemas.ToolServerProvider>
export type ToolServer = z.infer<typeof schemas.ToolServer>

export type MCPToolServerClient = z.infer<typeof schemas.MCPToolServerClient>
export type BlaxelToolServerClient = z.infer<
  typeof schemas.BlaxelToolServerClient
>

export type ToolServerClient = MCPToolServerClient | BlaxelToolServerClient

export type Tool = z.infer<typeof schemas.Tool>
export type ToolProperties = z.infer<typeof schemas.ToolProperties>

export type ToolResource = z.infer<typeof schemas.ToolResource>

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
