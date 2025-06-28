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
import { StructuredToolsRecommendation } from './types.js'
import { SystemMessage } from '@langchain/core/messages'
import { Prompt } from '@toolprint/api-client'

/**
 * Convert an EquippedTool to a DynamicStructuredTool that's compatible with LangChain agents
 */
const convertToLangChainTool = (equippedTool: EquippedTool): StructuredTool => {
  // Input zod type is required for Langchain to enforce input schema
  const zodInputType: ZodTypeAny = jsonSchemaUtils.toZodType(
    equippedTool.details.inputSchema
  )

  const _zodOutputType: ZodTypeAny = z.any()

  type ToolInputType = z.infer<typeof zodInputType>
  type ToolOutputType = z.infer<typeof _zodOutputType>

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
  const dynamicToolInput: DynamicStructuredToolInput<ToolOutputType> = {
    name: equippedTool.details.name,
    description: equippedTool.details.description,
    func: toolcallFunc,
    schema: zodInputType
  }

  return new DynamicStructuredTool(dynamicToolInput)
}

/** Converts a list of prompts to a list of LangChain SystemMessages */
const convertToLangChainMessages = (prompts: Prompt[]): SystemMessage[] => {
  return prompts.map((message) => {
    return new SystemMessage(message.message)
  })
}

/**
 * A Langchain Toolbox that provides tools compatible with LangChain agents
 *
 * NOTE: For Blaxel to work with LangChain StructuredTools, we must pin
 * @langchain/core to 0.3.40, as 0.3.44 has slight changes to the StructuredTool
 * interface that break Blaxel.  We will need to find better ways to manage
 * Toolbox interfaces to let us extend the Toolbox for various agent frameworks.
 */
export class LangchainToolbox
  implements BaseToolbox<StructuredTool, StructuredToolsRecommendation>
{
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

  async getMultiple(toolIds: ToolId[]): Promise<Map<ToolId, StructuredTool>> {
    const toolDetailsMap = await this.toolbox.getMultiple(toolIds)
    const structuredToolById: Map<ToolId, StructuredTool> = new Map()
    for (const [toolId, toolDetails] of toolDetailsMap) {
      const tool = await toolDetails.equip()
      structuredToolById.set(toolId, convertToLangChainTool(tool))
    }

    return structuredToolById
  }

  async recommend(goal: string): Promise<StructuredToolsRecommendation> {
    const recommendation = await this.toolbox.recommend(goal)
    const structuredTools: StructuredTool[] = await Promise.all(
      recommendation.tools.map(async (t) => {
        const et = await t.equip()
        return convertToLangChainTool(et)
      })
    )
    const messages: SystemMessage[] = convertToLangChainMessages(
      recommendation.messages
    )
    return {
      goal,
      tools: structuredTools,
      messages
    }
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
