import { healthcheck } from './commands/healthcheck'
import { getAuditLogs } from './commands/audit'
import { Command } from 'commander'
import { logger } from './utils/logger'

import { version } from '../package.json'

/**
 * Validates that required environment variables are set
 * @param skipValidation Whether to skip environment validation
 */
function validateEnvironment(skipValidation = false) {
  if (skipValidation) {
    logger.warn('Skipping environment variable validation')
    return
  }

  const required_env_vars = ['ONEGREP_API_KEY', 'ONEGREP_API_URL']
  const missing_vars = required_env_vars.filter(
    (env_var) => !process.env[env_var]
  )

  if (missing_vars.length > 0) {
    logger.error(
      `Missing required environment variables: ${missing_vars.join(', ')}`
    )
    logger.info(
      '\nYou can set environment variables in two ways:\n\t1) export ONEGREP_API_KEY=your_api_key && export ONEGREP_API_URL=https://api.onegrep.com\n\t2) Set vars in a .env file.'
    )
    process.exit(1)
  }
}

function main() {
  const cli = new Command()
    .name('onegrep-cli')
    .description(
      'Use the OneGrep CLI to debug and manage your OneGrep Toolbox.'
    )
    .version(version || '0.0.1')
    .hook('preAction', () => {
      validateEnvironment()
    })

  cli.addCommand(healthcheck)
  cli.addCommand(getAuditLogs)

  cli.parse()
}

main()
