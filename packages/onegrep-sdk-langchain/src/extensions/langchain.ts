import {
  DynamicStructuredTool,
  DynamicStructuredToolInput,
  StructuredTool
} from '@langchain/core/tools'
import { log } from '@repo/utils'
import {
  BaseToolbox,
  Toolbox,
  ToolCallOutput,
  ToolCallResponse,
  ToolResource,
  ToolResourceFilter
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

const convertToStructuredTool = (resource: ToolResource): StructuredTool => {
  // Input zod type is required for Langchain to enforce input schema
  const zodInputType: ZodTypeAny = resource.metadata.zodInputType()

  // Output zod type is required for Langchain to provide structured output (we use z.any() if not provided)
  const zodOutputType: ZodTypeAny = resource.metadata.zodOutputType()

  const inputZodObject: z.ZodObject<any> = ensureZodObject(zodInputType)
  const outputZodObject: z.ZodObject<any> = ensureZodObject(zodOutputType)

  type ToolInputType = z.infer<typeof inputZodObject>
  type ToolOutputType = z.infer<typeof outputZodObject>

  // The tool call function
  const toolcallFunc = async (
    input: ToolInputType
  ): Promise<ToolCallOutput<ToolOutputType>> => {
    const response: ToolCallResponse<ToolOutputType> = await resource.call({
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
    name: resource.metadata.name,
    description: resource.metadata.description,
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

  async listAll(): Promise<StructuredTool[]> {
    const resources = await this.toolbox.listAll()
    return resources.map((resource) => convertToStructuredTool(resource))
  }

  async filter(filter: ToolResourceFilter): Promise<StructuredTool[]> {
    const resources = await this.toolbox.filter(filter)
    return resources.map((resource) => convertToStructuredTool(resource))
  }

  async matchUnique(filter: ToolResourceFilter): Promise<StructuredTool> {
    const resource = await this.toolbox.matchUnique(filter)
    return convertToStructuredTool(resource)
  }

  async close(): Promise<void> {
    await this.toolbox.close()
  }
}

export async function createLangchainToolbox(toolbox: Toolbox) {
  return new LangchainToolbox(toolbox)
}
