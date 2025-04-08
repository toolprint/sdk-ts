/** Command set for authentication and account management operations. */
import { Command } from 'commander'
import { chalk, logger } from '../utils/logger'
import { clearTerminal, getSpinner } from '../utils/helpers'
import { select, input, confirm } from '@inquirer/prompts'
import Table from 'cli-table3'
import AuthzProvider from '../providers/auth/provider'
import { ConfigProvider } from 'providers/config/provider'

export function outputAuthenticationPrompt() {
  logger.log('\n\nYou are not authenticated.')
  logger.log(
    `Please run ${chalk.bold.blue('onegrep-cli account')} and select login to authenticate.\n\n`
  )
}

export function outputApiKeyInstructions() {
  logger.log(chalk.bold('\n\nAPI Key Instructions\n'))
  logger.log(
    'If you want to manually use an API key rather than authenticating, please follow the instructions below:\n'
  )
  logger.log(
    `${chalk.bold.blue('• Option 1 - export in your shell')}\n\t${chalk.bold.gray('$>')} ${chalk.yellow('export ONEGREP_API_KEY=<your-api-key>')}\n`
  )
  logger.log(
    `${chalk.bold.blue('• Option 2 - set it in your ".env" file')}\n\t${chalk.bold.gray('$>')} ${chalk.yellow('echo "ONEGREP_API_KEY=<your-api-key>" >> .env')}\n`
  )
  logger.log(
    `\n\nRun ${chalk.bold.blue('onegrep-cli status')} to verify the validity of your API key.\n\n`
  )
}

/**
 * Ensures API URL is set before proceeding with auth operations
 * @returns true if API URL is set (either already or by user input)
 */
async function forceCheckApiUrl(
  configProvider: ConfigProvider,
  forceSet: boolean = false
): Promise<boolean> {
  const currentUrl = configProvider.getConfig().identity?.apiUrl

  if (!currentUrl || forceSet) {
    if (!currentUrl) {
      logger.info(
        chalk.yellow(
          'API URL is not set. You need to set it before proceeding.'
        )
      )
    }

    const apiUrl = await input({
      message: 'What would you like your API URL to be?',
      default: currentUrl ?? 'https://test-sandbox.onegrep.dev',
      validate: (value) => {
        if (!value.trim()) return 'API URL is required'
        try {
          new URL(value) // Validate URL format
          return true
        } catch (e) {
          return 'Please enter a valid URL'
        }
      }
    })

    // Update the config with the API URL
    configProvider.updateIdentity({ apiUrl: apiUrl })
    configProvider.saveConfig()

    logger.log(chalk.green('✓ API URL updated successfully!'))
    return true
  }

  return true
}

/**
 * Handles account creation using an invitation code
 */
async function handleAccountCreation(params: {
  authProvider: AuthzProvider
  configProvider: ConfigProvider
}) {
  const spinner = getSpinner('Creating your account...')

  try {
    // Ensure API URL is set first
    if (!(await forceCheckApiUrl(params.configProvider))) {
      return
    }

    logger.info('Create a new OneGrep account with an invitation code')

    const invitationCode = await input({
      message: 'Enter your invitation code:',
      validate: (value) => {
        if (!value.trim()) return 'Invitation code is required'
        return true
      }
    })

    spinner.start()

    // Invoke the authentication flow with the invitation code
    const authenticated = await params.authProvider.initOAuthFlow({
      reauthenticate: true,
      invitationCode: invitationCode
    })

    if (!authenticated) {
      spinner.fail(
        'Account creation failed. Please check your invitation code and try again.'
      )
      process.exit(1)
    }

    spinner.succeed('Account created successfully!')
    params.configProvider.saveConfig()

    logger.log(`Run ${chalk.bold.blue('onegrep-cli help')} to get started.`)
  } catch (error) {
    // Force stop the spinner in case it's still running
    spinner.stop()
    logger.error(
      `Account creation failed: ${error instanceof Error ? error.message : String(error)}`
    )
    // Exit with error code to prevent hanging
    process.exit(1)
  }
}

/**
 * Provies instructions for setting an API key manually.
 */
async function handleSetApiKey(params: { configProvider: ConfigProvider }) {
  // Ensure API URL is set first
  if (!(await forceCheckApiUrl(params.configProvider))) {
    return
  }

  outputApiKeyInstructions()
}

async function loginUser(params: {
  authProvider: AuthzProvider
  configProvider: ConfigProvider
}) {
  await forceCheckApiUrl(params.configProvider)
  const spinner = getSpinner('Authenticating...')

  // Invoke the authentication flow
  const authenticated = await params.authProvider.initOAuthFlow({
    reauthenticate: true
  })

  if (!authenticated) {
    spinner.fail('Authentication failed. Please try again.')
  } else {
    spinner.succeed('Authentication successful!')
  }
}

/**
 * Handles the standard login flow
 */
async function handleLogin(params: {
  authProvider: AuthzProvider
  configProvider: ConfigProvider
}) {
  try {
    // Ensure API URL is set first
    if (!(await forceCheckApiUrl(params.configProvider))) {
      return
    }

    const spinner = getSpinner('Checking authentication state...')
    spinner.start()

    if (await params.authProvider.isAuthenticated()) {
      spinner.succeed(chalk.green('You are already authenticated.'))

      const reauthenticate = await confirm({
        message: 'Would you like to re-authenticate?',
        default: false
      })

      if (!reauthenticate) {
        return
      }

      await handleLogout({ configProvider: params.configProvider })
      await loginUser({
        authProvider: params.authProvider,
        configProvider: params.configProvider
      })
      await handleAccountStatus({
        configProvider: params.configProvider,
        authProvider: params.authProvider
      })
      return
    }

    spinner.stop()

    // Present them with options to login or create an account.
    const choice = await select({
      message: '\n\nSelect an option',
      choices: [
        { name: 'Login with my email', value: 'login' },
        { name: 'Create a new account', value: 'create-account' }
      ]
    })

    switch (choice) {
      case 'login':
        await loginUser({
          authProvider: params.authProvider,
          configProvider: params.configProvider
        })
        break
      case 'create-account':
        await handleAccountCreation(params)
        break
    }

    await handleAccountStatus({
      configProvider: params.configProvider,
      authProvider: params.authProvider
    })
  } catch (error) {
    logger.error(
      `Login failed: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Handles the logout flow
 */
async function handleLogout(params: { configProvider: ConfigProvider }) {
  try {
    const purgeApiUrl = await confirm({
      message: `Would you also like to clear your configured API URL (${params.configProvider.getConfig().identity?.apiUrl})?`,
      default: false
    })

    const confirmed = await confirm({
      message:
        'Are you sure you want to log out? This will clear all your credentials and you will need to re-authenticate.',
      default: false
    })

    if (!confirmed) {
      logger.info('Logout cancelled.')
      return
    }

    // Clear auth state
    params.configProvider.clearAuthState()
    params.configProvider.clearIdentity(purgeApiUrl)
    params.configProvider.saveConfig()

    logger.log(chalk.green('Logged out successfully.'))
  } catch (error) {
    logger.error(
      `Logout failed: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

async function handleAccountStatus(params: {
  configProvider: ConfigProvider
  authProvider: AuthzProvider
}) {
  clearTerminal()
  const spinner = getSpinner('Checking account status...')

  try {
    // For status command, we don't require API URL validation as we just want to show current status
    spinner.start()

    let isAuthenticated = false
    try {
      isAuthenticated = await params.authProvider.isAuthenticated()
    } catch (error) {
      logger.debug(`Authentication check failed: ${error}`)
    }

    const config = params.configProvider.getConfig()

    spinner.stop()

    const statusTable = new Table({
      style: {
        head: ['cyan'],
        border: []
      },
      head: [],
      wordWrap: true,
      colWidths: [20, 60]
    })

    statusTable.push(
      [
        chalk.blueBright('Status:'),
        isAuthenticated
          ? chalk.green('Authenticated')
          : chalk.red('Not authenticated')
      ],
      [
        chalk.blueBright('API URL:'),
        config.identity?.apiUrl || chalk.red('Not set')
      ]
    )

    if (config.identity?.email) {
      statusTable.push([chalk.blueBright('Email:'), config.identity.email])
    }

    if (config.identity?.userId) {
      statusTable.push([chalk.blueBright('User ID:'), config.identity.userId])
    }

    if (config.identity?.apiKey) {
      statusTable.push([chalk.blueBright('API Key:'), '[REDACTED]'])
    }

    logger.log(chalk.bold.blueBright('Authentication Details'))
    logger.log(statusTable.toString())

    if (!isAuthenticated) {
      outputAuthenticationPrompt()
      return
    }

    // Finally give them the option to see their API key.
    const showApiKey = await confirm({
      message: '\nWould you like to see your API key?',
      default: false
    })
    if (showApiKey) {
      logger.log(
        chalk.bold.redBright(
          `[WARNING] Keep your API key secret. To prevent it from being stored in your shell history, run:`
        )
      )
      logger.log(chalk.yellow(`export HISTIGNORE="ONEGREP_API_KEY*"\n`))

      logger.log(`\n\nONEGREP_API_KEY = ${config.identity!.apiKey!}\n`)
    }
  } catch (error) {
    // Force stop the spinner in case it's still running
    spinner.stop()
    logger.error(
      `Failed to retrieve account status: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

async function handleAccountSetup(params: {
  configProvider: ConfigProvider
  authProvider: AuthzProvider
}) {
  try {
    clearTerminal()
    logger.info(chalk.bold.blueBright('OneGrep Account Setup'))

    // Now show the account setup options
    const option = await select({
      message: 'Account Setup Options',
      choices: [
        {
          name: 'Create a new account (I have an invitation code)',
          value: 'create-account'
        },
        {
          name: 'Update my API URL',
          value: 'api-url'
        },
        {
          name: 'Use an existing API Key',
          value: 'api-key'
        },
        {
          name: 'Go back',
          value: 'go-back'
        }
      ]
    })

    switch (option) {
      case 'create-account':
        await forceCheckApiUrl(params.configProvider, true)
        await handleAccountCreation(params)
        await handleAccountStatus({
          configProvider: params.configProvider,
          authProvider: params.authProvider
        })
        break
      case 'api-key':
        await handleSetApiKey(params)
        break
      case 'api-url':
        await forceCheckApiUrl(params.configProvider, true)
        break
      case 'go-back':
        return
    }
  } catch (error) {
    logger.error(
      `Setup failed: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Creates the account command with subcommands for authentication and account management
 * @param authProvider The authentication client to use
 * @returns The configured account command
 */
export function getAccountsCommand(params: {
  configProvider: ConfigProvider
  authProvider: AuthzProvider
}): Command {
  const accountCommand = new Command('account').description(
    'Manage your OneGrep account and authentication'
  )

  accountCommand.action(async () => {
    clearTerminal()

    while (true) {
      logger.log(
        chalk.bold.blueBright(
          '\n\nSelect an option to manage your OneGrep account\n'
        )
      )
      const option = await select({
        message: '',
        choices: [
          {
            name: 'Setup or update my account',
            value: 'setup'
          },
          {
            name: 'See my authentication status',
            value: 'status'
          },
          {
            name: 'Login',
            value: 'login'
          },
          {
            name: 'Logout',
            value: 'logout'
          },
          {
            name: 'Exit',
            value: 'exit'
          }
        ]
      })

      switch (option) {
        case 'setup':
          await handleAccountSetup(params)
          break
        case 'status':
          await handleAccountStatus(params)
          break
        case 'login':
          await handleLogin(params)
          break
        case 'logout':
          await handleLogout(params)
          break
        case 'exit':
          process.exit(0)
      }
    }
  })

  return accountCommand
}
