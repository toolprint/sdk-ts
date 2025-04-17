import { describe, it, expect, beforeAll } from 'vitest'
import {
  // AndFilter,
  // ServerNameFilter,
  // ToolNameFilter,
  Toolbox,
  getToolbox
} from './toolbox.js'
import { log } from '@repo/utils'
import {
  ToolCallError,
  // ToolCallOutput,
  ToolCallResponse,
  ToolResource
} from './types.js'
// import Ajv from 'ajv'
// import { jsonSchemaUtils } from './schema'

describe('Toolbox Tests', () => {
  let toolbox: Toolbox

  // ! Tool args that work with the test-sandbox.onegrep.dev `meta` server which is a running mock_mcp server (reference impl in onegrep-api repo)
  const toolName = 'echo'
  // const toolArgs = {
  //   text: 'Hello, world!'
  // }

  beforeAll(async () => {
    log.info('Getting toolbox')
    toolbox = await getToolbox()
    log.info('Toolbox fetched')
  })

  it('should get all tool resources', async () => {
    const toolResources: ToolResource[] = await toolbox.listAll()
    expect(toolResources.length).toBeGreaterThan(0)
    log.info(`fetched tool resources: ${JSON.stringify(toolResources)}`)
  })

  it('should be able to get a zod schema from a tool', async () => {
    const tools: ToolResource[] = await toolbox.listAll()
    expect(tools.length).toBeGreaterThan(0)
    const tool = tools.find((tool) => tool.metadata.name === toolName)
    expect(tool).toBeDefined()
    if (!tool) {
      throw new Error('Tool not found')
    }
    const zodInputType = tool.metadata.zodInputType()
    log.info(`Zod input type: ${JSON.stringify(zodInputType)}`)
    if (!zodInputType) {
      throw new Error('Zod input type not found')
    }
    const zodOutputType = tool.metadata.zodOutputType()
    log.info(`Zod output type: ${JSON.stringify(zodOutputType)}`)
    if (!zodOutputType) {
      // throw new Error('Zod output type not found')
    }

    const testInput = {
      text: 'test'
    }
    const result = zodInputType.safeParse(testInput)
    log.info(`Result: ${JSON.stringify(result)}`)
    if (!result.success) {
      throw new Error('Failed to parse input')
    }

    const invalidInput = {
      text: false
    }
    const invalidResult = zodInputType.safeParse(invalidInput)
    log.info(`Invalid result: ${JSON.stringify(invalidResult)}`)
    if (invalidResult.success) {
      throw new Error('Invalid result should not be successful')
    }
  })

  // it('should be able to make a tool call to meta server', async () => {
  //   const metaServerName = 'meta' // ! Change to not be hard-coded, as this can change from the Meta Server
  //   const toolResources: ToolResource[] = await toolbox.listAll()
  //   expect(toolResources.length).toBeGreaterThan(0)
  //   log.info(
  //     `Tool names: ${toolResources.map((tool) => tool.metadata.name).join(', ')}`
  //   )

  //   const statusNamespaceFilter = AndFilter(
  //     ServerNameFilter(metaServerName),
  //     ToolNameFilter('API-health_health_get') // ! Change to not be hard-coded, as this can change from the Meta Server
  //   )
  //   const statusNamespaceResource = await toolbox.matchUnique(
  //     statusNamespaceFilter
  //   )

  //   const expectedOutput = {
  //     status: 'ok'
  //   }

  //   const outputJsonSchema = {
  //     type: 'object',
  //     properties: {
  //       status: {
  //         type: 'string'
  //       }
  //     },
  //     required: ['status']
  //   }
  //   const ajv = new Ajv()
  //   const validate = ajv.compile(outputJsonSchema)
  //   const valid = validate(expectedOutput)
  //   if (!valid) {
  //     throw new Error('Expected output is not valid')
  //   }

  //   const outputZodSchema = jsonSchemaUtils.toZodType(outputJsonSchema)

  //   // ! Inject an output schema (migrate to use ToolMetadata)
  //   statusNamespaceResource.setOutputSchema(outputJsonSchema)

  //   const args = {}
  //   const response: ToolCallResponse<any> = await statusNamespaceResource.call({
  //     args: args,
  //     approval: undefined
  //   })
  //   expect(response).toBeDefined()
  //   expect(response).toBeTypeOf('object')
  //   expect(response.isError).toBe(false)

  //   const output = response as ToolCallOutput<any>
  //   const zodOutput = output.toZod()
  //   log.info(`Tool output: ${JSON.stringify(zodOutput)}`)

  //   await new Promise((resolve) => setTimeout(resolve, 1000))

  //   const validationResult = outputZodSchema.safeParse(zodOutput)
  //   log.info(`Validation Result: ${JSON.stringify(validationResult)}`)
  //   if (!validationResult.success) {
  //     throw new Error(
  //       'Zod validation failed: ' + JSON.stringify(validationResult.error)
  //     )
  //   }
  // })

  it('should be able to make a tool call with invalid input', async () => {
    const tools: ToolResource[] = await toolbox.listAll()
    expect(tools.length).toBeGreaterThan(0)

    // const clientConfigTool = tools.find(
    //   (tool) =>
    //     tool.metadata.name ===
    //     'API-get_integration_api_v1_integrations__integration_name__get' // ! Change to not be hard-coded, as this can change from the Meta Server
    // )

    const clientConfigTool = tools.find(
      (tool) => tool.metadata.name === toolName
    )

    if (!clientConfigTool) {
      throw new Error(`"${toolName}" tool not found`)
    }

    const args = {
      invalid_key: 'baz'
    }

    const response: ToolCallResponse<any> = await clientConfigTool.call({
      args: args,
      approval: undefined
    })
    expect(response).toBeDefined()
    expect(response).toBeTypeOf('object')
    expect(response.isError).toBe(true)

    const error = response as ToolCallError
    log.info(`Error: ${JSON.stringify(error.message)}`)
    expect(error.message).toBe('Invalid tool input arguments')

    await new Promise((resolve) => setTimeout(resolve, 1000))
  })
})
