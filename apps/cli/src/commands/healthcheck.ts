import { Command } from 'commander'
import { chalk, logger } from '../utils/logger'
import { getToolbox, Toolbox } from '@onegrep/sdk'
import { getSpinner } from 'utils/helpers'

async function runHealthcheck() {
  logger.log(chalk.bold.magenta('Healthcheck'))
  const spinner = getSpinner('Checking connectivity...', 'yellow')
  spinner.start()

  let toolbox: Toolbox | undefined

  try {
    toolbox = await getToolbox()
    await toolbox.apiClient.health_health_get()
    spinner.succeed('Successfully connected to the OneGrep API')
  } catch (error) {
    spinner.fail('Failed to connect to the OneGrep API')
    logger.error(`Error getting toolbox: ${error}`)
  } finally {
    spinner.stop()
    await toolbox?.close()
  }
}

export const healthcheck = new Command()
  .name('healthcheck')
  .description('Check the health of the OneGrep API')
  .action(async () => {
    await runHealthcheck()
  })
