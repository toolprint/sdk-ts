import { describe, it, expect, beforeAll } from 'vitest'
import { createLangchainToolbox, LangchainToolbox } from './langchain.js'
import { ToolInputParsingException } from '@langchain/core/tools'
import { log } from '@repo/utils'
import { createToolbox, Toolbox } from '~/toolbox.js'
import { clientFromConfig } from '~/core/api/client.js'
import { FilterOptions, ToolCallOutput } from '~/types.js'

describe('Langchain Toolbox Tests', () => {
  let toolbox: Toolbox
  let langchainToolbox: LangchainToolbox

  // ! Previous tool name and args which presumably were for a locally running `time` server.
  // const toolName = 'API-get_integration_api_v1_integrations__integration_name__get'
  // const args = {
  //   integration_name: 'time'
  // }

  // ! Tool args that work with the test-sandbox.onegrep.dev `meta` server which is a running mock_mcp server (reference impl in onegrep-api repo)
  const integrationName = 'blaxel-search'
  const toolName = 'web_search'
  const toolArgs = {
    query: 'What is Langchain?'
  }

  beforeAll(async () => {
    const apiClient = clientFromConfig()
    toolbox = await createToolbox(apiClient)
    langchainToolbox = await createLangchainToolbox(toolbox) // Initialize toolbox before test suite
  })

  // ! NOT PERFORMANT
  it.skip('should get all structured tools', async () => {
    const toolMap = await langchainToolbox.listTools()
    expect(toolMap.size).toBeGreaterThan(0)

    const structuredTools = await Promise.all(
      Array.from(toolMap.keys()).map(async (toolId) => {
        return langchainToolbox.get(toolId)
      })
    )
    expect(structuredTools.length).toBeGreaterThan(0)
  })

  it('should be able to make a structured tool call with valid input', async () => {
    const filterOptions: FilterOptions = {
      integrationNames: [integrationName]
    }
    const toolMap = await langchainToolbox.filterTools(filterOptions)
    expect(toolMap.size).toBeGreaterThan(0)

    const structuredToolMetadata = Array.from(toolMap.values()).find(
      (tool) => tool.name === toolName
    )

    if (!structuredToolMetadata) {
      throw new Error(`${toolName} tool not found`)
    }

    const structuredTool = await langchainToolbox.get(structuredToolMetadata.id)

    log.info(`Structured tool: ${JSON.stringify(structuredTool)}`)

    const response: ToolCallOutput<any> = await structuredTool.invoke(toolArgs)
    expect(response).toBeDefined()
    expect(response).toBeTypeOf('object')
    expect(response.content.length).toBeGreaterThan(0)

    const zodOutput = response.toZod()
    log.info(`Tool output: ${JSON.stringify(zodOutput)}`)

    await new Promise((resolve) => setTimeout(resolve, 1000))
  })

  it('should be able to make a structured tool call with invalid input', async () => {
    const filterOptions: FilterOptions = {
      integrationNames: [integrationName]
    }
    const toolMap = await langchainToolbox.filterTools(filterOptions)
    expect(toolMap.size).toBeGreaterThan(0)

    const structuredToolMetadata = Array.from(toolMap.values()).find(
      (tool) => tool.name === toolName
    )

    if (!structuredToolMetadata) {
      throw new Error(`${toolName} tool not found`)
    }

    const structuredTool = await langchainToolbox.get(structuredToolMetadata.id)

    log.info(`Structured tool: ${JSON.stringify(structuredTool)}`)

    const args = {
      invalid_key: 'baz'
    }

    try {
      // Expect this to throw an exception.
      await structuredTool.invoke(args)
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
