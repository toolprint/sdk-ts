import chalk from 'chalk'
import { Command } from 'commander'
import { logger } from '../utils/logger'
import { getToolbox } from '@onegrep/sdk'
import { getSpinner } from 'utils/helpers'

async function runHealthcheck() {
  const apiUrl = process.env.ONEGREP_API_URL
  logger.info(`Checking connectivity with: ${chalk.bold(apiUrl)}`)

  const spinner = getSpinner('Checking connectivity...', 'yellow')
  spinner.start()

  const toolbox = await getToolbox()
  spinner.succeed(`Connected to ${chalk.bold(apiUrl)}`)

  toolbox.close().catch((error) => {
    logger.error(`Error closing toolbox: ${error}`)
  })
}

export const healthcheck = new Command()
  .name('healthcheck')
  .description('Check the health of the OneGrep API')
  .action(async () => {
    await runHealthcheck()
  })
