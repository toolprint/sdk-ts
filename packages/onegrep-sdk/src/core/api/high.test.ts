import { describe, it, expect } from 'vitest'
import { OneGrepApiHighLevelClient } from './high.js'
import { clientFromConfig } from './client.js'
import { testLog } from '../../../test/log.test.js'

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
})
