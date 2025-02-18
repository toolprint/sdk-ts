import { Tool } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import { log } from '@repo/utils'
import { JsonSchema, jsonSchemaToZod } from 'json-schema-to-zod'

export interface ToolMetadata {
  name: string
  description: string
  inputSchema: JsonSchema
  outputSchema?: JsonSchema
  zodInputType?: z.ZodTypeAny
  zodOutputType?: z.ZodTypeAny
}

export const toolMetadataFromTool = (
  tool: Tool,
  inputSchema: JsonSchema,
  outputSchema?: JsonSchema
): ToolMetadata => {
  const zodInputSchemaJS = jsonSchemaToZod(inputSchema)
  log.debug(`zodInputSchemaJS: ${zodInputSchemaJS}`)
  // ! DO A BETTER WAY WITHOUT EVAL
  // const zodInputSchema = eval(zodInputSchemaJS)

  return {
    name: tool.name,
    description: tool.description || tool.name,
    inputSchema: inputSchema,
    outputSchema: outputSchema || undefined,
    zodInputType: undefined, // TODO: ?
    zodOutputType: undefined // TODO: ?
  } as ToolMetadata
}
