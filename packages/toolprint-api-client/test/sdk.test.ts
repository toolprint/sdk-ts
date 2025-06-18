import { describe, it, expect } from 'vitest'

import { DefaultService } from '../src/index.js'

const log = console

describe('SDK Tests', () => {
  it('should successfully call the health endpoint', async () => {
    const response = await DefaultService.healthHealthGet()
    expect(response).toBeDefined()
    log.info(response)
  })
})
