import { describe, it, expect, beforeAll } from 'vitest'
import {
  createLangchainToolbox,
  LangchainToolbox
} from '../src/extensions/langchain'
import {
  StructuredTool,
  ToolInputParsingException
} from '@langchain/core/tools'
import { Toolbox, ToolCallOutput, ToolResource } from '@onegrep/sdk'
import { createToolbox } from '@onegrep/sdk'
import { clientFromConfig } from '@onegrep/sdk'
import { log } from '@repo/utils'

describe('Toolbox Tests', () => {
  let toolbox: Toolbox
  let langchainToolbox: LangchainToolbox

  // ! Previous tool name and args which presumably were for a locally running `time` server.
  // const toolName = 'API-get_integration_api_v1_integrations__integration_name__get'
  // const args = {
  //   integration_name: 'time'
  // }

  // ! Tool args that work with the test-sandbox.onegrep.dev `meta` server which is a running mock_mcp server (reference impl in onegrep-api repo)
  const toolName = 'echo'
  const toolArgs = {
    text: 'Hello, world!'
  }

  beforeAll(async () => {
    const apiClient = clientFromConfig()
    toolbox = await createToolbox(apiClient)
    langchainToolbox = await createLangchainToolbox(toolbox) // Initialize toolbox before test suite
  })

  it('should get all tool resources', async () => {
    const tools: ToolResource[] = await toolbox.listAll()
    expect(tools.length).toBeGreaterThan(0)
  })

  it('should get all structured tools', async () => {
    const tools: StructuredTool[] = await langchainToolbox.listAll()
    expect(tools.length).toBeGreaterThan(0)
  })

  it('should be able to make a structured tool call with valid input', async () => {
    const tools: StructuredTool[] = await langchainToolbox.listAll()
    expect(tools.length).toBeGreaterThan(0)
    log.info(`Tool names: ${tools.map((tool) => tool.name).join(', ')}`)

    const clientConfigTool = tools.find((tool) => tool.name === toolName)
    if (!clientConfigTool) {
      throw new Error(`${toolName} tool not found`)
    }

    log.info(`Structured tool: ${JSON.stringify(clientConfigTool)}`)

    const response: ToolCallOutput<any> =
      await clientConfigTool.invoke(toolArgs)
    expect(response).toBeDefined()
    expect(response).toBeTypeOf('object')
    expect(response.content.length).toBeGreaterThan(0)

    const zodOutput = response.toZod()
    log.info(`Tool output: ${JSON.stringify(zodOutput)}`)

    await new Promise((resolve) => setTimeout(resolve, 1000))
  })

  it('should be able to make a structured tool call with invalid input', async () => {
    const tools: StructuredTool[] = await langchainToolbox.listAll()
    expect(tools.length).toBeGreaterThan(0)
    log.info(`Tool names: ${tools.map((tool) => tool.name).join(', ')}`)

    const clientConfigTool = tools.find((tool) => tool.name === toolName)
    if (!clientConfigTool) {
      throw new Error(`${toolName} tool not found`)
    }

    log.info(`Structured tool: ${JSON.stringify(clientConfigTool)}`)
    const args = {
      invalid_key: 'baz'
    }

    try {
      // Expect this to throw an exception.
      await clientConfigTool.invoke(args)
    } catch (error) {
      if (error instanceof ToolInputParsingException) {
        log.info(`Tool call error: ${error.message}`)
      } else {
        throw error
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  })
})
