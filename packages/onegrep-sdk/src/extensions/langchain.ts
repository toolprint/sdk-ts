import {
  DynamicStructuredTool,
  DynamicStructuredToolInput,
  StructuredTool
} from '@langchain/core/tools'
import { log } from '@repo/utils'
import {
  BaseToolbox,
  EquippedTool,
  jsonSchemaUtils,
  ScoredResult,
  Toolbox,
  ToolCallOutput,
  ToolCallResponse,
  ToolMetadata
} from '@onegrep/sdk'
import { z, ZodTypeAny } from 'zod'

// TODO: Is this needed?
// type ExtractZodShape<T> = T extends z.ZodObject<infer Shape> ? Shape : never

function ensureZodObject<T extends z.ZodTypeAny>(
  schema: T
): T extends z.ZodObject<any> ? T : z.ZodObject<{ value: T }> {
  if (schema instanceof z.ZodObject) {
    return schema as any
  }
  return z.object({ value: schema }) as any
}

const convertToStructuredTool = (
  equippedTool: EquippedTool
): StructuredTool => {
  // Input zod type is required for Langchain to enforce input schema
  const zodInputType: ZodTypeAny = jsonSchemaUtils.toZodType(
    equippedTool.metadata.inputSchema
  )

  // Output zod type is required for Langchain to provide structured output (we use z.any() if not provided)
  // const zodOutputType: ZodTypeAny = jsonSchemaUtils.toZodType(equippedTool.metadata.outputSchema)
  const zodOutputType: ZodTypeAny = z.any()

  const inputZodObject: z.ZodObject<any> = ensureZodObject(zodInputType)
  const outputZodObject: z.ZodObject<any> = ensureZodObject(zodOutputType)

  type ToolInputType = z.infer<typeof inputZodObject>
  type ToolOutputType = z.infer<typeof outputZodObject>

  // The tool call function
  const toolcallFunc = async (
    input: ToolInputType
  ): Promise<ToolCallOutput<ToolOutputType>> => {
    const response: ToolCallResponse<ToolOutputType> =
      await equippedTool.handle.call({
        args: input,
        approval: undefined // TODO: approvals
      })
    if (response.isError) {
      log.error(`Tool call error: ${response.message}`)
      // TODO: How does Langchain want us to handle errors?
      throw new Error(response.message)
    }
    return response
  }

  // Create the dynamic structured tool
  const dynamicToolInput: DynamicStructuredToolInput<ToolInputType> = {
    name: equippedTool.metadata.name,
    description: equippedTool.metadata.description,
    schema: inputZodObject,
    func: toolcallFunc
  }
  return new DynamicStructuredTool(dynamicToolInput)
}

/**
 * A Langchain Toolbox that provides StructuredTools for all the tools in the toolbox
 */
export class LangchainToolbox implements BaseToolbox<StructuredTool> {
  toolbox: Toolbox

  constructor(toolbox: Toolbox) {
    this.toolbox = toolbox
  }

  async metadata(): Promise<Map<string, ToolMetadata>> {
    return this.toolbox.metadata()
  }

  async get(toolId: string): Promise<StructuredTool> {
    const tool = await this.toolbox.get(toolId)
    return convertToStructuredTool(tool)
  }

  async search(query: string): Promise<Array<ScoredResult<StructuredTool>>> {
    const searchResults = await this.toolbox.search(query)
    return searchResults.map((result) => ({
      ...result,
      result: convertToStructuredTool(result.result)
    }))
  }

  async close(): Promise<void> {
    await this.toolbox.close()
  }
}

export async function createLangchainToolbox(toolbox: Toolbox) {
  return new LangchainToolbox(toolbox)
}
