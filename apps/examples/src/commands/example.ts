import chalk from 'chalk'
import ora from 'ora'
import { Command } from 'commander'
import { logger } from '../utils/logger'

import { getToolbox, JsonSchema, ToolResource } from '@onegrep/sdk'

const spinner = ora({
  text: 'Loading...',
  color: 'yellow'
})

export const showTools = new Command()
  .name('show-tools')
  .description(
    'Connect to the OneGrep API and get the tools for a given integration'
  )
  .option('-i, --integration <integration>', 'The integration to get tools for')
  .option('-v, --verbose', 'Verbose output')
  .action(async (options) => {
    await runTools(options.integration, options.verbose)
  })

export async function runTools(integration: string, verbose: boolean) {
  // Log mode for '@onegrep/sdk' can be: 'silent' or 'console'
  const logMode = process.env.LOG_MODE
  const logLevel = process.env.LOG_LEVEL
  logger.info(`Log mode for '@onegrep/sdk': ${logMode}`)

  // Make sure that your API key is set via the environment variable ONEGREP_API_KEY
  const apiUrl = process.env.ONEGREP_API_URL
  logger.info(`Connecting to: ${chalk.bold(apiUrl)}`)
  spinner.start()

  const toolbox = await getToolbox()
  const allTools = await toolbox.listAll()
  spinner.succeed(`Connected to ${chalk.bold(apiUrl)}`)

  logger.info(`Found ${allTools.length} tools`)

  const integrations = [
    ...new Set(allTools.map((tool) => tool.metadata.integrationName))
  ]
  logger.info(`Integrations: ${integrations.join(', ')}`)

  // Simplify the JSON schema to only include the properties and required fields
  function simplifiedJsonSchema(schema: JsonSchema) {
    if (typeof schema === 'boolean') {
      return schema
    }
    return {
      properties: schema.properties,
      required: schema.required
    }
  }

  // Simplify the tool metadata to only include the name and description
  function simplifiedToolMetadata(tool: ToolResource) {
    return {
      name: tool.metadata.name,
      description: tool.metadata.description
    }
  }

  // Include the name, description, and input schema
  function verboseToolMetadata(tool: ToolResource) {
    return {
      name: tool.metadata.name,
      description: tool.metadata.description,
      input: simplifiedJsonSchema(tool.metadata.inputSchema)
    }
  }

  // Group the tools by integration
  const toolMetadataByIntegration: Record<string, ToolResource[]> =
    integrations.reduce(
      (acc, i) => {
        acc[i] = allTools.filter((tool) => tool.metadata.integrationName === i)
        return acc
      },
      {} as Record<string, ToolResource[]>
    )

  // If an integration is provided, log the tools for that integration
  if (integration && toolMetadataByIntegration[integration]) {
    const integrationTools = toolMetadataByIntegration[integration]

    // If verbose, log the tools with the input schema
    if (verbose) {
      const toolMetadata = integrationTools.map((tool) =>
        verboseToolMetadata(tool)
      )
      logger.info(
        `Tools for integration ${integration}: ${JSON.stringify(toolMetadata, null, 2)}`
      )
    } else {
      const toolMetadata = integrationTools.map((tool) =>
        simplifiedToolMetadata(tool)
      )
      logger.info(
        `Tools for integration ${integration}: ${JSON.stringify(toolMetadata, null, 2)}`
      )
    }
  } else {
    // Instructions for viewing a specific integration
    logger.info(
      `${chalk.green('Use the --integration flag to get tools for a specific integration')}`
    )
    logger.info(
      `${chalk.green('Example:')} ${chalk.grey.bold('npm run cli show-tools -- --integration notion')}`
    )
  }
}
