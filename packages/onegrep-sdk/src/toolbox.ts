import {
  clientFromConfig,
  OneGrepApiClient,
  ToolServerClient
} from '~/core/index.js'
import {
  BaseToolbox,
  ToolCache,
  FilterOptions,
  ToolId,
  ScoredResult,
  ToolDetails,
  BasicToolDetails,
  Recommendation
} from '~/types.js'
import { getDopplerSecretManager } from './secrets/doppler.js'

import { createToolCache } from '~/toolcache.js'

import {
  apiKeyBlaxelClientSessionMaker,
  apiKeySmitheryClientSessionMaker,
  defaultToolServerSessionFactory
} from './connection.js'
import { ClientSessionMaker } from './connection.js'
import { SecretManager } from './secrets/index.js'

import { log } from '~/core/log.js'

export class Toolbox implements BaseToolbox<ToolDetails, Recommendation> {
  apiClient: OneGrepApiClient
  toolCache: ToolCache

  constructor(apiClient: OneGrepApiClient, toolCache: ToolCache) {
    this.apiClient = apiClient
    this.toolCache = toolCache
  }

  async listTools(): Promise<Map<ToolId, BasicToolDetails>> {
    return this.toolCache.listTools()
  }

  async listIntegrations(): Promise<string[]> {
    return this.toolCache.listIntegrations()
  }

  async filterTools(
    options?: FilterOptions
  ): Promise<Map<ToolId, ToolDetails>> {
    return this.toolCache.filterTools(options)
  }

  async get(toolId: ToolId): Promise<ToolDetails> {
    return this.toolCache.get(toolId)
  }

  async recommend(goal: string): Promise<Recommendation> {
    return this.toolCache.recommend(goal)
  }

  async search(query: string): Promise<Array<ScoredResult<ToolDetails>>> {
    return this.toolCache.search(query)
  }

  async refresh(): Promise<boolean> {
    return this.toolCache.refresh()
  }

  async close(): Promise<void> {
    await this.toolCache.cleanup()
  }
}

/**
 * Registers the session makers for the given secret manager based on secrets available.
 */
const registerSessionMakers = async (secretManager: SecretManager) => {
  const requestedSecretNames = [
    'BL_API_KEY',
    'BL_WORKSPACE',
    'SMITHERY_API_KEY'
  ]
  // Get requested secrets (do not throw an error if any are missing)
  const secrets = await secretManager.getSecrets(requestedSecretNames, false)

  // Blaxel provider requires an API key and workspace
  if (secrets.has('BL_API_KEY') && secrets.has('BL_WORKSPACE')) {
    const blaxelSessionMaker = apiKeyBlaxelClientSessionMaker(
      secrets.get('BL_API_KEY')!,
      secrets.get('BL_WORKSPACE')!
    )

    // Register the new BlaxelSessionMaker
    defaultToolServerSessionFactory.register(
      'blaxel',
      blaxelSessionMaker as ClientSessionMaker<ToolServerClient>
    )
    log.info('Registered BlaxelSessionMaker')
  }

  // Smithery provider requires an API key
  if (secrets.has('SMITHERY_API_KEY')) {
    const smitherySessionMaker = apiKeySmitheryClientSessionMaker(
      secretManager,
      secrets.get('SMITHERY_API_KEY')!
    )
    defaultToolServerSessionFactory.register(
      'smithery',
      smitherySessionMaker as ClientSessionMaker<ToolServerClient>
    )
    log.info('Registered SmitherySessionMaker')
  }

  // ! As a hack, we need to sync the process environment to get environment variables for authentication
  // TODO: Remove this once we have more reliable ways to create API clients
  // For some reason, even when we provide all the Blaxel config directly above, something is still using the env vars
  if (process.env.ONEGREP_SDK_INJECT_SECRETS_TO_ENV || true) {
    await secretManager.syncProcessEnvironment()
  }
}

export async function createToolbox(
  apiClient: OneGrepApiClient,
  providedToolCache?: ToolCache,
  providedSecretManager?: SecretManager
) {
  // Make sure the secret manager is initialized
  const secretManager =
    providedSecretManager ?? (await getDopplerSecretManager())
  await secretManager.initialize()

  // Register available session makers
  await registerSessionMakers(secretManager)

  // Create the tool cache if not provided
  const toolCache: ToolCache =
    providedToolCache ?? (await createToolCache(apiClient))

  // Make sure the tool cache attempts to refresh on bootstrap (to warm cache)
  const ok = await toolCache.refresh()

  if (!ok) {
    log.error('Toolcache initialization failed. Tools will not be available.')
  }

  return new Toolbox(apiClient, toolCache)
}

export async function getToolbox(): Promise<Toolbox> {
  return await createToolbox(clientFromConfig())
}
