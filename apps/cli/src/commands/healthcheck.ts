import chalk from 'chalk'
import ora from 'ora'
import { Command } from 'commander'
import { logger } from '../utils/logger'

import { getToolbox } from '@onegrep/sdk'

const spinner = ora({
  text: 'Loading...',
  color: 'yellow'
})

export const healthcheck = new Command()
  .name('healthcheck')
  .description('Check the health of the OneGrep API')
  .action(async () => {
    await runHealthcheck()
  })

export async function runHealthcheck() {
  const apiUrl = process.env.ONEGREP_API_URL
  logger.info(`Connecting to: ${chalk.bold(apiUrl)}`)
  spinner.start()

  const toolbox = await getToolbox()
  spinner.succeed(`Connected to ${chalk.bold(apiUrl)}`)

  toolbox
    .close()
    .then(() => {
      logger.info(`Toolbox closed`)
    })
    .catch((error) => {
      logger.error(`Error closing toolbox: ${error}`)
    })
}
