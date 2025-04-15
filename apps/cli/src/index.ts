import { healthcheck } from './commands/healthcheck'
import { getAuditLogs } from './commands/audit'
import { Command } from 'commander'
import { chalk, logger } from './utils/logger'

import { version } from '../package.json'
import { toolsCommand } from 'commands/tools'
import { clearTerminal } from 'utils/helpers'
import { ConfigProvider } from 'providers/config/provider'
import AuthzProvider from 'providers/auth/provider'
import {
  getAccountsCommand,
  outputAuthenticationPrompt
} from 'commands/account'

// Authentication validation function that checks if user is authenticated
async function validateAuthenticationState(authProvider: AuthzProvider) {
  try {
    if (!(await authProvider.isAuthenticated())) {
      outputAuthenticationPrompt()
      process.exit(1)
    }
  } catch (error) {
    logger.debug(`Authentication check failed: ${error}`)
    logger.log(
      'Authentication check failed. Run the following command to setup your account:'
    )
    logger.log(`$> ${chalk.bold.green('onegrep-cli')} account\n\n`)
  }
}

async function main() {
  try {
    clearTerminal()
    const configProvider = new ConfigProvider()
    await configProvider.init()

    // Create auth client
    const authProvider = new AuthzProvider({
      configProvider
    })

    logger.debug(`Config: ${configProvider.getConfig().modelDumpJSON()}`)

    const cli = new Command()
      .name('onegrep-cli')
      .description(
        'Use the OneGrep CLI to debug and manage your OneGrep Toolbox.'
      )
      .version(version)
      .hook('preAction', async (_thisCommand, actionCommand) => {
        // Commands that should not trigger authentication validation
        const authBlacklist = ['account']

        // Skip authentication for blacklisted commands
        const commandName = actionCommand.name()
        const parentName = actionCommand.parent?.name()

        // Check if this command or its parent is in the blacklist
        if (
          authBlacklist.includes(commandName) ||
          (parentName !== undefined && authBlacklist.includes(parentName))
        ) {
          return
        }

        // Run authentication validation for all other commands
        await validateAuthenticationState(authProvider)
      })

    // Add all the commands
    cli.addCommand(healthcheck)
    cli.addCommand(getAuditLogs)
    cli.addCommand(toolsCommand)
    cli.addCommand(getAccountsCommand({ configProvider, authProvider }))

    cli.parse()
  } catch (err) {
    logger.error(`Error setting up CLI: ${err}`)
    logger.log(
      `If you are running into authentication issues, run ${chalk.bold.blue('onegrep-cli account')} and select setup to configure your environment.`
    )
    process.exit(1)
  }
}

// Instead of await main() - we do this because we are outputting a CJS module which does not support top-level awaits.
void main().catch((err) => {
  logger.error(`Error running CLI: ${err}`)
  process.exit(1)
})
