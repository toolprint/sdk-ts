import { schemas } from '@repo/onegrep-api-client'
import { z } from 'zod'

export type ToolServerProviderId = string
export type ToolServerId = string
export type ToolId = string

export type JsonSchema = Record<string, any> | boolean

export type ToolTags = Record<string, any>

export type ToolCallArgs = Record<string, any>

export interface ResultContent {
  type: 'text' | 'object' | 'binary'
}

export interface TextResultContent extends ResultContent {
  type: 'text'
  text: string
}

export interface ObjectResultContent extends ResultContent {
  type: 'object'
  data: Record<string, any>
}

export interface BinaryResultContent extends ResultContent {
  type: 'binary'
  data: string
  mime_type: string
}

export type ToolCallResultContent = Array<ResultContent>

// ! TODO: Deprecate this
export type ApiToolResource = z.infer<typeof schemas.ToolResource>

export interface ToolCallApproval {}

export interface ToolCallInput {
  args: ToolCallArgs
  approval: ToolCallApproval | undefined
}

export interface ToolCallError {
  isError: true
  message: string
}

export type ToolCallOutputMode = 'single' | 'multiple'

export interface ToolCallOutput<T> {
  isError: false
  content: ToolCallResultContent
  mode: ToolCallOutputMode
  toZod: () => T
}

export type ToolCallResponse<T> = ToolCallOutput<T> | ToolCallError

/**
 * This is the metadata that is used to describe a tool.
 */
export interface ToolMetadata {
  id: string
  name: string
  description: string

  // Integration properties
  serverId: string
  integrationName: string

  // Cosmetic properties
  iconUrl?: URL

  // Schema properties
  inputSchema: JsonSchema

  // zodInputType: () => z.ZodTypeAny
  // zodOutputType: () => z.ZodTypeAny
}

export interface ToolHandle {
  call: (input: ToolCallInput) => Promise<ToolCallResponse<any>>
  callSync: (input: ToolCallInput) => ToolCallResponse<any>
}

/**
 * The core resource object that is used to describe and interact with a tool.
 */
export interface EquippedTool {
  metadata: ToolMetadata
  tags: ToolTags
  handle: ToolHandle

  // TODO: Get Policies
  // policy: BasePolicy
}

export interface ToolFilter {
  (metadata: ToolMetadata): boolean
}

export interface ScoredResult<T> {
  score: number
  result: T
}

export interface ToolCache {
  refresh(): Promise<boolean>
  metadata(toolFilter?: ToolFilter): Promise<Map<ToolId, ToolMetadata>>
  get(toolId: ToolId): Promise<EquippedTool>
  search(query: string): Promise<Array<ScoredResult<EquippedTool>>>
  cleanup(): Promise<void>
}

export interface BaseToolbox<T> {
  metadata(toolFilter?: ToolFilter): Promise<Map<ToolId, ToolMetadata>>
  get(toolId: ToolId): Promise<T>
  search(query: string): Promise<Array<ScoredResult<T>>>
  close(): Promise<void>
}
