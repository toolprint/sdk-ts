import { Buffer } from 'buffer'
import {
  CallToolResult,
  TextContent,
  ImageContent,
  EmbeddedResource
} from '@modelcontextprotocol/sdk/types.js'
import {
  ToolCallResultContent,
  ObjectResultContent,
  ToolCallOutput,
  TextResultContent,
  BinaryResultContent,
  ToolCallOutputMode
  // JsonSchema
} from '../../types.js'
import { log } from '@repo/utils'
import { ToolDetails } from '../../types.js'
// import { jsonSchemaUtils } from '../schema.js'

export type McpCallToolResultContent = Array<
  TextContent | ImageContent | EmbeddedResource
>

// Parse MCP TextContent into an ObjectResultContent validated against the output schema
// Throws an error if the content is not valid or if the text is not valid JSON
// function parseOutputContent(
//   content: TextContent,
//   outputSchema: JsonSchema
// ): ObjectResultContent {
//   try {
//     const parsedJson: Record<string, any> = JSON.parse(content.text)
//     // console.debug(`Parsed JSON: ${JSON.stringify(parsedJson)}`)
//     const validator = jsonSchemaUtils.getValidator(outputSchema)
//     const valid = validator(parsedJson)
//     if (!valid) {
//       throw new Error(`Tool output content is not valid`)
//     }
//     return { type: 'object', data: parsedJson }
//   } catch (error) {
//     throw new Error(`JSON parsing failed: ${error}`)
//   }
// }

// Validate the number of MCP TextContent results to the output mode
// Returns an array of ObjectResultContent validated against the output schema
// function _validateOutputSchema(
//   contents: TextContent[],
//   outputSchema: JsonSchema,
//   mode: ToolCallOutputMode = 'single' // TODO: Put this in the tool metadata
// ): ObjectResultContent[] {
//   const resultContents: ObjectResultContent[] = []
//   if (mode === 'single') {
//     if (contents.length < 1) {
//       return resultContents
//     } else if (contents.length > 1) {
//       throw new Error(`Expected 0..1 content, got ${contents.length}`)
//     }
//   }

//   // Parse the contents into schema-validated objects
//   for (const content of contents) {
//     resultContents.push(parseOutputContent(content, outputSchema))
//   }
//   return resultContents
// }

// If we're attempting to validate using an output schema, we need to first ensure we have all MCP TextContent
// Any Image Content or Resource Content returned would mean we don't have a "Structured" tool result.
// function validateOutputSchema(
//   contents: McpCallToolResultContent,
//   outputSchema: JsonSchema
// ): ObjectResultContent[] {
//   if (
//     !contents.every((item) => typeof item === 'object' && item.type === 'text')
//   ) {
//     throw new Error('All content must be of type TextContent.')
//   } else {
//     return _validateOutputSchema(contents, outputSchema)
//   }
// }

// A parsing approach to results from MCP when we are not provided an output schema
// If enabled, attemptStructuredOutput settings will attempt to create ObjectResultContent from TextContent if it is valid JSON
// Otherwise, we return a TextResultContent as a fallback.  We convert ImageContent to BinaryContent for consistency.
export function parseMcpContent(
  mcpContent: McpCallToolResultContent,
  attemptStructuredOutput: boolean = true // TODO: Should attempt structured output be the default behavior?
): ToolCallResultContent {
  const resultContent: (
    | TextResultContent
    | ObjectResultContent
    | BinaryResultContent
  )[] = []
  for (const content of mcpContent) {
    if (content.type === 'text') {
      // TODO: Should indicate in the tool metadata that structured output should be attempted
      if (attemptStructuredOutput) {
        try {
          const parsedJson = JSON.parse(content.text)
          resultContent.push({ type: 'object', data: parsedJson })
        } catch (error) {
          log.debug(`Invalid JSON: ${error}`)
          resultContent.push({ type: 'text', text: content.text })
        }
      } else {
        resultContent.push({ type: 'text', text: content.text })
      }
    } else if (content.type === 'image') {
      // Decode the base64-encoded image data
      const decodedData = Buffer.from(content.data, 'base64').toString('binary')
      resultContent.push({
        type: 'binary',
        data: decodedData,
        mime_type: content.mimeType
      })
    } else if (content.type === 'resource') {
      throw new Error('Embedded resources are not implemented yet')
    } else {
      throw new Error(`Unknown content type: ${JSON.stringify(content)}`)
    }
  }
  return resultContent
}

// ! TODO: Broken for now because we need to refactor output schema
// Parse raw MCP results into a ToolCallOutput
// First check if the tool result is an error, if so, throw an error
// If the tool metadata includes an output schema, we attempt to validate the output schema
// Otherwise, we parse the raw content into a ToolCallResultContent
export function parseMcpResult<T>(
  result: CallToolResult,
  toolDetails: ToolDetails,
  mode: ToolCallOutputMode = 'single' // TODO: Put this in the tool metadata
): ToolCallOutput<T> {
  if (result.isError) {
    throw new Error(`MCP Tool call failed`)
  }

  // Attempt to validate the output schema if it is provided, otherwise attempt to parse the raw content
  // if (toolMetadata.outputSchema) {
  //   log.debug(`Validating structured output for tool: ${toolMetadata.name}`)
  //   const content = validateOutputSchema(
  //     result.content,
  //     toolMetadata.outputSchema
  //   )

  //   // Create a function that safely parses the content into the zod output type
  //   const toZod = () => {
  //     const outputZodType = toolMetadata.zodOutputType()
  //     // console.debug(`Content: ${JSON.stringify(content)}`)
  //     const zodOutput =
  //       mode === 'single'
  //         ? outputZodType.safeParse(content[0].data)
  //         : outputZodType.array().safeParse(content.map((c) => c.data))
  //     if (!zodOutput.success) {
  //       throw new Error(`Failed to parse tool output`)
  //     }
  //     return zodOutput.data
  //   }

  //   return { isError: false, content, mode, toZod } as ToolCallOutput<T>
  // } else {
  log.warn(`No output schema provided for tool: ${toolDetails.name}`)
  const content = parseMcpContent(result.content as McpCallToolResultContent)
  return {
    isError: false,
    content,
    mode,
    toZod: () => undefined
  } as ToolCallOutput<T>
  // }
}
