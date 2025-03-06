import { describe, it, expect, beforeEach } from 'vitest'
import { createLangchainToolbox, LangchainToolbox } from './langchain'
import {
  StructuredTool,
  ToolInputParsingException
} from '@langchain/core/tools'
import {
  RemoteClientConfig,
  Toolbox,
  ToolCallOutput,
  ToolCallResponse,
  ToolResource
} from '@onegrep/sdk'
import { createToolbox } from '@onegrep/sdk'
import { clientFromConfig } from '@onegrep/sdk'
import { log } from '@repo/utils'

describe('Toolbox Tests', () => {
  let toolbox: Toolbox
  let langchainToolbox: LangchainToolbox

  beforeEach(async () => {
    const apiClient = clientFromConfig()
    toolbox = await createToolbox(apiClient)
    langchainToolbox = await createLangchainToolbox(toolbox) // Initialize toolbox before each test
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

    const clientConfigTool = tools.find(
      (tool) =>
        tool.name ===
        'API-get_integration_api_v1_integrations__integration_name__get' // ! Change to not be hard-coded, as this can change from the Meta Server
    )
    if (!clientConfigTool) {
      throw new Error(
        'API-get_integration_api_v1_integrations__integration_name__get tool not found'
      )
    }

    log.info(`Structured tool: ${JSON.stringify(clientConfigTool)}`)
    const args = {
      integration_name: 'time'
    }

    const response: ToolCallOutput<any> = await clientConfigTool.invoke(args)
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

    const clientConfigTool = tools.find(
      (tool) =>
        tool.name ===
        'API-get_integration_api_v1_integrations__integration_name__get' // ! Change to not be hard-coded, as this can change from the Meta Server
    )
    if (!clientConfigTool) {
      throw new Error(
        'API-get_integration_api_v1_integrations__integration_name__get tool not found'
      )
    }

    log.info(`Structured tool: ${JSON.stringify(clientConfigTool)}`)
    const args = {
      invalid_key: 'baz'
    }

    try {
      const response: ToolCallResponse<any> =
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
