import { expect, test } from 'vitest'

import { runTools } from './example'

test('show-tools', async () => {
  await runTools('linear', false)
})
