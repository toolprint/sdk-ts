import { schemas } from '@repo/onegrep-api-client'
import { z } from 'zod'

export type ToolId = string

export type JsonSchema = Record<string, any> | boolean

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

export type AccountInformation = z.infer<typeof schemas.AccountInformation>
// export type BasePolicy = z.infer<typeof schemas.BasePolicy>
export type Policy = z.infer<typeof schemas.Policy>
// export type ToolCustomProperties = z.infer<typeof schemas.ToolCustomProperties>
export type ToolProperties = z.infer<typeof schemas.ToolProperties>
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
  name: string
  description: string
  integrationName: string

  // Cosmetic properties
  extraProperties?: ToolProperties
  iconUrl?: URL

  // Schema properties
  inputSchema: JsonSchema
  outputSchema?: JsonSchema

  zodInputType: () => z.ZodTypeAny
  zodOutputType: () => z.ZodTypeAny
}

/**
 * The core resource object that is used to describe and interact with a tool.
 */
export interface ToolResource {
  id: ToolId
  metadata: ToolMetadata
  policy: Policy

  // TODO: This is a temporary method to set the output schema
  setOutputSchema(outputSchema: JsonSchema): void

  call<T>(input: ToolCallInput): Promise<ToolCallResponse<T>>
}

export interface ToolCache {
  refresh(): Promise<boolean>
  refreshIntegration(integrationName: string): Promise<boolean>
  get(key: ToolId): Promise<ToolResource | undefined>
  list(): Promise<ToolResource[]>
  cleanup(): Promise<void>
}

export interface ToolResourceFilter {
  (resource: ToolResource): boolean
}

export interface BaseToolbox<T> {
  listAll(): Promise<T[]>
  filter(filter: ToolResourceFilter): Promise<T[]>
  matchUnique(filter: ToolResourceFilter): Promise<T>
  close(): Promise<void>
}
