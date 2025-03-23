import { Command } from 'commander'
import { logger } from '../utils/logger'
import { getToolbox } from '@onegrep/sdk'
import { getSpinner } from 'utils/helpers'

async function runHealthcheck() {
  const spinner = getSpinner('Checking connectivity...', 'yellow')
  spinner.start()
  const toolbox = await getToolbox()

  try {
    await toolbox.apiClient.health_health_get()
    spinner.succeed('Successfully connected to the OneGrep API')
  } catch (error) {
    spinner.fail('Failed to connect to the OneGrep API')
    logger.error(`Error getting toolbox: ${error}`)
  } finally {
    spinner.stop()
    await toolbox.close()
  }
}

export const healthcheck = new Command()
  .name('healthcheck')
  .description('Check the health of the OneGrep API')
  .action(async () => {
    await runHealthcheck()
  })
