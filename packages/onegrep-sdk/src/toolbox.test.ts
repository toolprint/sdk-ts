import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Toolbox, getToolbox } from './toolbox.js'
import { log } from '@repo/utils'
import {
  ToolCallError,
  ToolCallResponse,
  EquippedTool,
  ToolCallOutput
} from './types.js'
import { jsonSchemaUtils } from './schema.js'
import 'dotenv/config'

describe('Toolbox Tests', () => {
  let toolbox: Toolbox

  // ! Tool is available for Blaxel deployment
  const toolName = 'web_search'

  beforeAll(async () => {
    log.info('Getting toolbox')
    toolbox = await getToolbox()
    log.info('Toolbox fetched')
  })

  afterAll(async () => {
    await toolbox.close()
    log.info('Toolbox closed')
  })

  it('should get all tool resources', async () => {
    const toolDetailsMap = await toolbox.listTools()
    expect(toolDetailsMap.size).toBeGreaterThan(0)
    log.info(`fetched tool metadata: ${JSON.stringify(toolDetailsMap)}`)
  })

  it('should be able to get a zod schema from a tool', async () => {
    const toolDetailsMap = await toolbox.listTools()
    expect(toolDetailsMap.size).toBeGreaterThan(0)

    const toolDetails = Array.from(toolDetailsMap.values()).find(
      (details) => details.name === toolName
    )
    expect(toolDetails).toBeDefined()
    if (!toolDetails) {
      throw new Error(`Tool with name ${toolName} not found`)
    }
    const tool: EquippedTool = await toolbox.get(toolDetails.id)
    expect(tool).toBeDefined()
    if (!tool) {
      throw new Error('Tool not found')
    }
    const zodInputType = jsonSchemaUtils.toZodType(tool.details.inputSchema)
    log.info(`Zod input type: ${JSON.stringify(zodInputType)}`)
    if (!zodInputType) {
      throw new Error('Zod input type not found')
    }

    const testInput = {
      query: 'test'
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

  it('should be able to make a tool call with invalid input', async () => {
    const toolDetailsMap = await toolbox.listTools()
    expect(toolDetailsMap.size).toBeGreaterThan(0)
    const toolDetails = Array.from(toolDetailsMap.values()).find(
      (details) => details.name === toolName
    )
    expect(toolDetails).toBeDefined()
    if (!toolDetails) {
      throw new Error(`Tool with name ${toolName} not found`)
    }
    const tool: EquippedTool = await toolbox.get(toolDetails.id)
    expect(tool).toBeDefined()
    if (!tool) {
      throw new Error('Tool not found')
    }

    const args = {
      invalid_key: 'baz'
    }

    const response: ToolCallResponse<any> = await tool.handle.call({
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

  it('should be able to make a tool call with valid input', async () => {
    const toolDetailsMap = await toolbox.listTools()
    expect(toolDetailsMap.size).toBeGreaterThan(0)
    const toolDetails = Array.from(toolDetailsMap.values()).find(
      (details) => details.name === toolName
    )
    expect(toolDetails).toBeDefined()
    if (!toolDetails) {
      throw new Error(`Tool with name ${toolName} not found`)
    }
    const tool: EquippedTool = await toolbox.get(toolDetails.id)
    expect(tool).toBeDefined()
    if (!tool) {
      throw new Error('Tool not found')
    }

    const args = {
      query: 'what is the capital of the moon?'
    }

    const response: ToolCallResponse<any> = await tool.handle.call({
      args: args,
      approval: undefined
    })
    expect(response).toBeDefined()
    expect(response).toBeTypeOf('object')
    expect(response.isError).toBe(false)

    const output = response as ToolCallOutput<any>
    log.info(`Output: ${JSON.stringify(output)}`)

    await new Promise((resolve) => setTimeout(resolve, 1000))
  })
})
