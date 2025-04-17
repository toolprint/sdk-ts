import { expect, test } from 'vitest'

import { runTools } from './example.js'

test('show-tools', async () => {
  await runTools('linear', false)
})
