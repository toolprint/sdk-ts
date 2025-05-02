import { describe, it, expect } from 'vitest'
import { api, createApiClient } from './api'
import { Zodios } from '@zodios/core'

describe('Onegrep API Client', () => {
  it('has default instance', () => {
    expect(api).toBeInstanceOf(Zodios)
  })

  it('can be instantiated with a custom base url', () => {
    const api = createApiClient('http://localhost:8080')
    expect(api).toBeInstanceOf(Zodios)
  })
})
