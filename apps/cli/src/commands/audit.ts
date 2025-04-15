import { Command } from 'commander'
import { logger } from '../utils/logger'
import { getSpinner, isDefined } from 'utils/helpers'
import { getToolbox, Toolbox } from '@onegrep/sdk'
import chalk from 'chalk'

/**
 * Fetches audit logs with the specified pagination options
 */
async function fetchAuditLogs(options: {
  page?: number
  pageSize?: number
  policyId?: string
  action?: string
  startDate?: string
  endDate?: string
}) {
  logger.log(chalk.bold.magenta('Audit Logs'))
  let toolbox: Toolbox | undefined

  try {
    toolbox = await getToolbox()

    const spinner = getSpinner('Fetching audit logs...', 'yellow')
    spinner.start()

    const query_params: Record<string, any> = {
      page: options.page || 1,
      page_size: options.pageSize || 10
    }

    if (isDefined(options.policyId)) {
      query_params.policy_id = options.policyId
    }

    if (isDefined(options.action)) {
      query_params.action = options.action
    }

    if (isDefined(options.startDate)) {
      query_params.start_date = options.startDate
    }

    if (isDefined(options.endDate)) {
      query_params.end_date = options.endDate
    }

    const auditLogs = await toolbox.apiClient.get_audit_logs_api_v1_audit__get({
      queries: query_params
    })

    logger.info(
      `Fetching logs with filters: ${JSON.stringify(query_params, null, 2)}`
    )

    spinner.succeed('Audit logs fetched')
    logger.log(
      chalk.greenBright.bgBlackBright(JSON.stringify(auditLogs, null, 2))
    )

    toolbox.close().catch((error) => {
      logger.error(`Error closing toolbox: ${error}`)
    })
  } catch (e) {
    logger.error(`Error fetching audit logs: ${e}`)
  } finally {
    await toolbox?.close()
  }
}

export const getAuditLogs = new Command()
  .name('audit-logs')
  .aliases(['a'])
  .description('Fetch and display audit logs')
  .option(
    '-p, --page <number> (default: 1)',
    'Page number to fetch',
    parseFloat
  )
  .option(
    '-ps, --page-size <number> (default: 10)',
    'Number of items per page',
    parseFloat
  )
  .option('-i, --policy-id <string>', 'Policy ID to filter audit logs')
  .option('-a, --action <string>', 'Action to filter audit logs')
  .option(
    '-s, --start-date <date-time> (ISO 8601)',
    'Start date to filter audit logs'
  )
  .option(
    '-e, --end-date <date-time> (ISO 8601)',
    'End date to filter audit logs'
  )
  .action(async (options) => {
    await fetchAuditLogs({
      page: options.page,
      pageSize: options.pageSize
    })
  })
