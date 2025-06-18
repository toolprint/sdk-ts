import {
  ToolProperties,
  Policy,
  Prompt,
  ToolprintInput,
  RegisteredToolprintReadable
} from '@onegrep/api-client'

import { ToolServerClient } from '~/core/api/types.js'

export type ToolServerProviderId = string
export type ToolServerId = string
export type ToolId = string

export type JsonSchema = Record<string, any> | boolean

/**
 * Schemas that represent how to pass inputs to a tool.
 */
export type ToolCallArgs = Record<string, any>
export interface ToolCallApproval {}
export interface ToolCallInput {
  args: ToolCallArgs
  approval: ToolCallApproval | undefined
}

/**
 * These are the types that describe the shape of a result's content
 */
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

/**
 * These are the types that describe the shape of a tool call's output.
 */
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
 * The core set of details about a tool without additional profile-specific
 * properties
 */
export interface BasicToolDetails {
  id: ToolId
  name: string
  description: string

  // Integration properties
  serverId: string
  integrationName: string

  // Schema properties
  inputSchema: JsonSchema

  // Cosmetic properties
  iconUrl?: URL
}

/**
 * Details about a tool including metadata that is specific to the
 * profile of the caller.
 */
export interface ToolDetails extends BasicToolDetails {
  // User-defined properties to describe this tool.
  properties: ToolProperties

  // The tool policy that has been applied to this tool.
  policy: Policy

  // A function that can be used to equip the tool.
  equip: () => Promise<EquippedTool>
}

/**
 * A generic recommendation type that is composed of a list of unordered
 * tools and a list of messages that sequentially describe the best way for
 * a model / LLM / agent to use the tools to achieve a goal.
 */
export interface Recommendation {
  goal: string
  tools: ToolDetails[]
  messages: Prompt[]
}

/**
 * A handle to a tool that is used to call the tool.
 */
export interface ToolHandle {
  call: (input: ToolCallInput) => Promise<ToolCallResponse<any>>
  callSync: (input: ToolCallInput) => ToolCallResponse<any>
}

/**
 * A connection to a tool server that is used to call the tool.
 */
export interface ToolServerConnection {
  initialize: () => Promise<void>
  getHandle: (toolDetails: BasicToolDetails) => Promise<ToolHandle>
  close: () => Promise<void>
}

export interface ConnectionManager {
  connect: (client: ToolServerClient) => Promise<ToolServerConnection>
  close: () => Promise<void>
}

/**
 * A resource object that is used to interact with a tool.
 */
export interface EquippedTool {
  details: ToolDetails
  handle: ToolHandle
}

export interface ToolFilter {
  integrationName: string
  toolName: string
}

/**
 * Filtering options that can be passed to the toolbox to filter down to a specific set of tools.
 */
export interface FilterOptions {
  serverIds?: string[]
  integrationNames?: string[]
  tools?: ToolFilter[]
}

/**
 * A generic representation of a search result with a score for its relevance.
 */
export interface ScoredResult<T> {
  score: number
  result: T
}

export interface ToolDetailsStore {
  listTools(): Promise<Map<ToolId, BasicToolDetails>> // ! Potentially non-scalable (use filter instead)
  listIntegrations(): Promise<string[]>
  filterTools(toolFilter?: FilterOptions): Promise<Map<ToolId, ToolDetails>>
}

/**
 * A cache of tool details that can be used to query and refresh tool details.
 */
export interface ToolCache extends ToolDetailsStore {
  get(toolId: ToolId): Promise<ToolDetails>
  getMultiple(toolIds: ToolId[]): Promise<Map<ToolId, ToolDetails>>
  search(query: string): Promise<Array<ScoredResult<ToolDetails>>>
  recommend(goal: string): Promise<Recommendation>

  // Housekeeping methods
  refresh(): Promise<boolean>
  refreshTool(toolId: ToolId): Promise<ToolDetails> // Needed for when a tool's properties get updated its cached internally.
  cleanup(): Promise<void>
}

export interface BaseToolbox<T, R> extends ToolDetailsStore {
  /** Returns a recommendation comprising of tools and messages describing the best way to use them given
   * the goal at hand.
   * @param goal - The goal to use to recommend tools.
   * @returns A recommendation comprising of tools and messages describing the best way to use them given
   * the goal at hand.
   */
  recommend(goal: string): Promise<R>

  /**
   * Returns a tool by its id.
   * @param toolId - The id of the tool to get.
   * @returns The tool.
   */
  get(toolId: ToolId): Promise<T>

  /**
   * Returns a map of tools by their ids.
   * @param toolIds - The ids of the tools to get.
   * @returns A map of tools by their ids.
   */
  getMultiple(toolIds: ToolId[]): Promise<Map<ToolId, T>>

  /**
   * Searches for tools based on a query.
   * @param query - The query to search for.
   * @returns A list of tools that match the query.
   */
  search(query: string): Promise<Array<ScoredResult<T>>>

  /**
   * Closes the toolbox and releases all associated resources.
   */
  close(): Promise<void>
}

export interface BaseToolPrinter {
  validate(content: string, format: 'json' | 'yaml'): Promise<ToolprintInput>
  register(toolprint: ToolprintInput): Promise<RegisteredToolprintReadable>
}
