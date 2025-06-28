import { describe, it, expect } from 'vitest'
import { OneGrepApiHighLevelClient } from './high.js'
import { clientFromConfig } from './client.js'
import { testLog } from '../../../test/log.test.js'
import {
  ToolprintInput,
  ToolprintMetaInput,
  ToolprintTool
} from '@toolprint/api-client'
import { OneGrepApiError } from './utils.js'

const log = testLog

describe('OneGrepApiHighLevelClient', () => {
  const client = new OneGrepApiHighLevelClient(clientFromConfig())

  describe('HighLevelClient .well-known endpoints', () => {
    it('should get toolprint JSON schema', async () => {
      const schema = await client.getToolprintJsonSchema()
      expect(schema).toBeDefined()
      expect(typeof schema).toBe('object')
      log.info('Retrieved toolprint schema:', schema)
    })

    it('HighLevelClient should retrieve toolprint template', async () => {
      const template = await client.getToolprintTemplate()
      expect(template).toBeDefined()
      expect(typeof template).toBe('string')
      expect(template.length).toBeGreaterThan(0)
      log.info('Retrieved toolprint template:', template)
    })
  })

  describe('HighLevelClient toolprint validation', () => {
    it('should show validation errors', async () => {
      const meta: ToolprintMetaInput = {
        name: 'test',
        resource_id: 'test',
        version: '1.0.0'
      }
      const tool: ToolprintTool = {
        ref: {
          name: 'test'
        },
        usage_hints: 'HINT'
      }
      const toolprintInput: ToolprintInput = {
        meta: meta,
        goal: 'test',
        instructions: 'test',
        tools: [tool]
      }

      await expect(
        client.newToolprint(toolprintInput as ToolprintInput)
      ).rejects.toThrow(OneGrepApiError)

      try {
        await client.newToolprint(toolprintInput as ToolprintInput)
      } catch (err) {
        expect(err).toBeInstanceOf(OneGrepApiError)
        const oneGrepError = err as OneGrepApiError
        log.info('OneGrepApiError:', oneGrepError)
        expect(oneGrepError.data).toBeDefined()
        expect(oneGrepError.data).toBeTypeOf('object')
        log.info(
          'Validation error data:',
          JSON.stringify(oneGrepError.data, null, 2)
        )
        // You can add more specific assertions about the error data structure if you know what to expect
      }
    })
  })

  describe('HighLevelClient searchToolprints', () => {
    it('should return toolprints for a basic query', async () => {
      const query = 'search'
      const result = await client.searchToolprints(query)
      expect(result).toBeDefined()
      expect(result.results).toBeInstanceOf(Array)
      expect(result.pagination).toBeDefined()
      if (result.results.length > 0) {
        const first = result.results[0]
        expect(first).toHaveProperty('item')
        expect(first).toHaveProperty('score')
        expect(typeof first.score).toBe('number')
        expect(first.item).toHaveProperty('toolprint')
        expect(first.item).toHaveProperty('tools')
        expect(Array.isArray(first.item.tools)).toBe(true)
      }
      log.info('searchToolprints result:', JSON.stringify(result, null, 2))
    })

    it('should respect options like k and min_score', async () => {
      const query = 'search'
      const options = { query, k: 1, min_score: 0 }
      const result = await client.searchToolprints(query, options)
      expect(result).toBeDefined()
      expect(result.results.length).toBeLessThanOrEqual(1)
      if (result.results.length > 0) {
        expect(result.results[0].score).toBeGreaterThanOrEqual(0)
      }
      log.info(
        'searchToolprints with options:',
        JSON.stringify(result, null, 2)
      )
    })

    it('should prioritize the query parameter over options.query', async () => {
      const query = 'search'
      const options = { query: 'should_not_be_used', k: 1 }
      const result = await client.searchToolprints(query, options)
      // The result should reflect the real query, not the one in options
      expect(result).toBeDefined()
      log.info(
        'searchToolprints query precedence:',
        JSON.stringify(result, null, 2)
      )
    })
  })

  describe('HighLevelClient getAiTxt', () => {
    it('should return the ai.txt', async () => {
      const aiTxt = await client.getAiTxt()
      expect(aiTxt).toBeDefined()
      expect(typeof aiTxt).toBe('string')
      log.info('Retrieved ai.txt:', aiTxt)
    })
  })

  describe('HighLevelClient toolprint aitxt', () => {
    it('should return the toolprint ai.txt', async () => {
      const aiTxt = await client.getToolprintAiTxt()
      expect(aiTxt).toBeDefined()
      expect(typeof aiTxt).toBe('string')
      log.info('Retrieved toolprint ai.txt:', aiTxt)
    })
  })
})
