import { z } from 'zod'

export type ToolId = string

export type JsonSchema = Record<string, any> | boolean

export type ExtraProperties = Record<string, any>

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

export interface ToolMetadata {
  name: string
  description: string
  iconUrl?: URL
  integrationName: string
  inputSchema: JsonSchema
  outputSchema?: JsonSchema
  extraProperties?: ExtraProperties

  zodInputType: () => z.ZodTypeAny
  zodOutputType: () => z.ZodTypeAny
}

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

export interface ToolResource {
  id: ToolId
  metadata: ToolMetadata

  // TODO: This is a temporary method to set the output schema
  setOutputSchema(outputSchema: JsonSchema): void

  call<T>(input: ToolCallInput): Promise<ToolCallResponse<T>>
}

export interface ToolCache {
  refresh(): Promise<boolean>
  get(key: ToolId): Promise<ToolResource | undefined>
  list(): Promise<ToolResource[]>
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
