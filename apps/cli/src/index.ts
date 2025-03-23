import { healthcheck } from './commands/healthcheck'
import { getAuditLogs } from './commands/audit'
import { Command } from 'commander'
import { logger } from './utils/logger'

import { version } from '../package.json'
import { toolsCommand } from 'commands/tools'
import { clearTerminal } from 'utils/helpers'

/**
 * Validates that required configuration is available
 * @param command The Command instance
 */
function validateConfiguration(command: Command) {
  logger.info(`Validating configuration...`)
  const requiredEnvVars = ['ONEGREP_API_KEY', 'ONEGREP_API_URL']

  let isMissingEnvVars = false
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      logger.error(`Missing required environment variable: ${envVar}`)
      isMissingEnvVars = true
    }
  }

  if (isMissingEnvVars) {
    console.info(
      `Please set the required environment variables (${requiredEnvVars.join(
        ', '
      )}) in your .env file or export them in your shell`
    )

    process.exit(1)
  }

  if (command.opts().debug) {
    logger.info(`API URL: ${process.env.ONEGREP_API_URL}`)
    logger.info(`API Key: ${process.env.ONEGREP_API_KEY?.slice(0, 3)}...`)
  }
}

function main() {
  clearTerminal()

  const cli = new Command()
    .name('onegrep-cli')
    .description(
      'Use the OneGrep CLI to debug and manage your OneGrep Toolbox.'
    )
    .version(version || '0.0.1')
    .option('--debug', 'Enable debug mode', false)
    .hook('preAction', (command) => {
      validateConfiguration(command)
    })

  cli.addCommand(healthcheck)
  cli.addCommand(getAuditLogs)
  cli.addCommand(toolsCommand)

  cli.parse()
}

main()
