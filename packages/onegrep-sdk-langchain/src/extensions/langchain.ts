import {
  DynamicStructuredTool,
  DynamicStructuredToolInput,
  StructuredTool
} from '@langchain/core/tools'
import { Toolbox } from '@repo/onegrep-sdk'
import { ToolResource } from '@repo/onegrep-sdk'
import { z } from 'zod'

async function _call(resource: ToolResource, input: any): Promise<any> {
  const result = await resource.callTool(input)
  const json_content = []
  for (const content of result.content) {
    if (content.type === 'text') {
      const parsedContent = JSON.parse(content.text)
      json_content.push(parsedContent)
    } else {
      throw new Error(`Unsupported content type: ${content.type}`)
    }
  }
  // TODO: handle parse as output schema?
  return json_content
}

const convertToStructuredTool = (
  resource: ToolResource,
  enforceInputSchema: boolean = true
): StructuredTool => {
  // TODO: How best to translate zodInputType to zodObject?
  const inputSchema = z.object({})
  const outputSchema = z.object({})

  const dynamicToolInput: DynamicStructuredToolInput = {
    name: resource.toolMetadata.name,
    description: resource.toolMetadata.description,
    schema: enforceInputSchema ? inputSchema : z.object({}), // TODO: enforcing input schema breaks?
    func: async (
      input: z.infer<typeof inputSchema>
    ): Promise<z.infer<typeof outputSchema>> => {
      console.log(input)
      return await _call(resource, input)
    }
  }
  return new DynamicStructuredTool(dynamicToolInput)
}

export class LangchainToolbox {
  toolbox: Toolbox

  constructor(toolbox: Toolbox) {
    this.toolbox = toolbox
  }

  async getAllTools(): Promise<StructuredTool[]> {
    const resources = await this.toolbox.getToolResources()
    return resources.map((resource) => convertToStructuredTool(resource, false)) // TODO: enforce input schema?
  }
}

export async function createLangchainToolbox(toolbox: Toolbox) {
  return new LangchainToolbox(toolbox)
}
