import { test } from 'vitest'

import { runHealthcheck } from '../src/commands/healthcheck'

test('onegrep-cli-healthcheck', async () => {
  await runHealthcheck()
})
