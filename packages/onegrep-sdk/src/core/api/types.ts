import { z } from 'zod'

import { schemas } from '@repo/onegrep-api-client'

// Export types from the generated API client for use in the high-level API client
// SDK models
export type InitializeResponse = z.infer<typeof schemas.InitializeResponse>
export type AuthenticationStatus = z.infer<typeof schemas.AuthenticationStatus>
export type FlagsResponse = z.infer<typeof schemas.GetAllFlagsResponse>
export type UpsertSecretRequest = z.infer<typeof schemas.UpsertSecretRequest>
export type UpsertSecretResponse = z.infer<typeof schemas.UpsertSecretResponse>

// Account models
export type AccountInformation = z.infer<typeof schemas.AccountInformation>

// Provider models
export type ToolServerProvider = z.infer<typeof schemas.ToolServerProvider>
export type ToolServer = z.infer<typeof schemas.ToolServer>
export type MCPToolServerClient = z.infer<typeof schemas.MCPToolServerClient>
export type BlaxelToolServerClient = z.infer<
  typeof schemas.BlaxelToolServerClient
>
export type SmitheryToolServerClient = z.infer<
  typeof schemas.SmitheryToolServerClient
>
export type ToolServerLaunchConfig = z.infer<
  typeof schemas.ToolServerLaunchConfig
>
export type ToolServerClient =
  | MCPToolServerClient
  | BlaxelToolServerClient
  | SmitheryToolServerClient

// Tool models
export type Tool = z.infer<typeof schemas.Tool>
export type ToolProperties = z.infer<typeof schemas.ToolProperties>
export type ToolResource = z.infer<typeof schemas.ToolResource>
export type SearchResponseScoredItemTool = z.infer<
  typeof schemas.SearchResponse_ScoredItem_Tool__
>

// Policy models
export type Policy = z.infer<typeof schemas.Policy>

// Toolprint models
export type Prompt = z.infer<typeof schemas.Prompt>
export type Toolprint = z.infer<typeof schemas.Toolprint_Input>
export type RegisteredToolprint = z.infer<typeof schemas.RegisteredToolprint>
export type ToolprintRecommendation = z.infer<
  typeof schemas.ToolprintRecommendation
>
export type SearchResponseScoredRegisteredToolprint = z.infer<
  typeof schemas.SearchResponse_ScoredItem_RegisteredToolprint__
>

// Search response models
export type SearchResponse =
  | SearchResponseScoredItemTool
  | SearchResponseScoredRegisteredToolprint
