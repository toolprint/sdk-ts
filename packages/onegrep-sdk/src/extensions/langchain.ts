import {
  EquippedTool,
  ToolCallResponse,
  ToolId,
  ToolDetails,
  BasicToolDetails,
  FilterOptions,
  ScoredResult,
  BaseToolbox
} from '~/types.js'
import { Toolbox } from '~/toolbox.js'
import { jsonSchemaUtils } from '~/schema.js'

import {
  DynamicStructuredTool,
  DynamicStructuredToolInput,
  StructuredTool
} from '@langchain/core/tools'

import { z, ZodTypeAny } from 'zod'

import { log } from '~/core/log.js'

function ensureZodObject<T extends z.ZodTypeAny>(
  schema: T
): T extends z.ZodObject<any> ? T : z.ZodObject<{ value: T }> {
  if (schema instanceof z.ZodObject) {
    return schema as any
  }
  return z.object({ value: schema }) as any
}

/**
 * Convert an EquippedTool to a DynamicStructuredTool that's compatible with LangChain agents
 */
const convertToLangChainTool = (equippedTool: EquippedTool): StructuredTool => {
  // Input zod type is required for Langchain to enforce input schema
  const zodInputType: ZodTypeAny = jsonSchemaUtils.toZodType(
    equippedTool.details.inputSchema
  )

  const zodOutputType: ZodTypeAny = z.any()

  const inputZodObject: z.ZodObject<any> = ensureZodObject(zodInputType)
  const outputZodObject: z.ZodObject<any> = ensureZodObject(zodOutputType)

  type ToolInputType = z.infer<typeof inputZodObject>
  type ToolOutputType = z.infer<typeof outputZodObject>

  // The tool call function with proper signature for LangChain
  const toolcallFunc = async (
    input: ToolInputType
  ): Promise<ToolCallResponse<ToolOutputType>> => {
    const response: ToolCallResponse<ToolOutputType> =
      await equippedTool.handle.call({
        args: input,
        approval: undefined // TODO: approvals
      })
    if (response.isError) {
      log.error(`Tool call error: ${response.message}`)
      throw new Error(response.message)
    }
    return response
  }

  // Create the dynamic structured tool
  const dynamicToolInput: DynamicStructuredToolInput<ToolInputType> = {
    name: equippedTool.details.name,
    description: equippedTool.details.description,
    schema: inputZodObject,
    func: toolcallFunc
  }

  return new DynamicStructuredTool(dynamicToolInput)
}

/**
 * A Langchain Toolbox that provides tools compatible with LangChain agents
 */
export class LangchainToolbox implements BaseToolbox<StructuredTool> {
  toolbox: Toolbox

  constructor(toolbox: Toolbox) {
    this.toolbox = toolbox
  }

  async listTools(): Promise<Map<ToolId, BasicToolDetails>> {
    return this.toolbox.listTools()
  }

  async filterTools(
    filterOptions?: FilterOptions
  ): Promise<Map<ToolId, ToolDetails>> {
    return this.toolbox.filterTools(filterOptions)
  }

  async listIntegrations(): Promise<string[]> {
    return this.toolbox.listIntegrations()
  }

  async get(toolId: string): Promise<StructuredTool> {
    const toolDetails = await this.toolbox.get(toolId)
    const tool = await toolDetails.equip()
    return convertToLangChainTool(tool)
  }

  async search(query: string): Promise<Array<ScoredResult<StructuredTool>>> {
    const searchResults = await this.toolbox.search(query)
    const equippedToolResults: ScoredResult<EquippedTool>[] = await Promise.all(
      searchResults.map(async (result) => {
        const toolDetails = result.result
        const tool = await toolDetails.equip()
        return {
          score: result.score,
          result: tool
        }
      })
    )
    const structuredToolResults: ScoredResult<StructuredTool>[] =
      equippedToolResults.map((result) => ({
        score: result.score,
        result: convertToLangChainTool(result.result)
      }))
    return structuredToolResults
  }

  async close(): Promise<void> {
    await this.toolbox.close()
  }
}

export async function createLangchainToolbox(toolbox: Toolbox) {
  return new LangchainToolbox(toolbox)
}
