import DopplerSDK from '@dopplerhq/node-sdk'

import { SecretManager } from './types.js'

import { InitializeResponse } from '@toolprint/api-client'

import { OneGrepApiClient } from '~/core/index.js'
import { OneGrepApiHighLevelClient } from '~/core/index.js'
import { clientFromConfig } from '~/core/index.js'

import { log } from '~/core/log.js'

/**
 * A secret manager that uses pre-configured Doppler to store and retrieve SDK secrets.
 *
 * Configuration is driven by the OneGrep API based on the currently authenticated user.
 */
export class DopplerSecretManager implements SecretManager {
  private apiClient: OneGrepApiClient
  private highLevelClient: OneGrepApiHighLevelClient

  private client: DopplerSDK | undefined
  private serviceToken: string | undefined
  private project: string | undefined
  private config: string | undefined

  constructor(apiClient: OneGrepApiClient) {
    this.apiClient = apiClient
    this.highLevelClient = new OneGrepApiHighLevelClient(this.apiClient)
    this.client = undefined
  }

  async initialize(): Promise<void> {
    log.debug('Initializing Doppler secret manager...')

    try {
      const initResponse: InitializeResponse =
        await this.highLevelClient.initialize()

      // ? If none of these get vended, this will error out.
      this.serviceToken = initResponse.doppler_service_token as string
      this.project = initResponse.doppler_project as string
      this.config = initResponse.doppler_config as string

      log.debug(`Doppler configuration received:`)
      log.debug(`  Project: ${this.project}`)
      log.debug(`  Config: ${this.config}`)
      log.debug(
        `  Service Token: ${this.serviceToken ? `${this.serviceToken.substring(0, 8)}...` : 'undefined'}`
      )

      this.client = new DopplerSDK({ accessToken: this.serviceToken })

      log.info('Doppler secret manager initialized successfully')
    } catch (error) {
      log.error('Failed to initialize Doppler secret manager:', error)
      throw error
    }
  }

  private isInitialized(): boolean {
    return this.client !== undefined
  }

  private async fetchSecrets(): Promise<Map<string, string>> {
    /** Fetches secrets from Doppler. Does not cache secrets by design so that
     * any secrets fetched from the Doppler API are immediately available to
     * the SDK and are not stale.
     */
    if (!this.isInitialized()) {
      log.error(
        'Doppler Secrets Manager not initialized - cannot fetch secrets'
      )
      throw new Error('Doppler Secrets Manager not initialized')
    }

    log.debug(
      `Fetching secrets from Doppler project: ${this.project}, config: ${this.config}`
    )

    try {
      const secrets = await this.doppler.secrets.list(
        this.project!,
        this.config!
      )

      if (!secrets.secrets) {
        log.debug('No secrets discovered from doppler secrets manager')
      } else {
        const secretCount = Object.keys(secrets.secrets).length
        log.debug(`Successfully fetched ${secretCount} secrets from Doppler`)
      }

      return this.parseSecretsResponse(secrets)
    } catch (error) {
      log.error(
        `Failed to fetch secrets from Doppler project: ${this.project}, config: ${this.config}`
      )
      log.error('Doppler API error details:', error)
      throw error
    }
  }

  private parseSecretsResponse(secrets: any): Map<string, string> {
    // Secrets model is a mess from doppler so we'll jsonify it and re-parse it
    const secretsJson = JSON.stringify(secrets)
    const secretsParsed = JSON.parse(secretsJson)
    /**
     * Structure of secretsParsed is:
     *
     * {
     *    secrets: {
     *        <secret_name>: { // ! This is the secret name.
     *            raw: xxx, // ! this is what we want.
     *            computed: xxx
     *        }
     *    }
     * }
     *
     * Parse this into a map of secret name to secret value.
     */

    const secretsMap = new Map<string, string>()
    let skippedCount = 0

    for (const secretName in secretsParsed.secrets) {
      // Doppler secrets.list returns DOPPLER_ prefixed secrets for some reason so we'll skip them.
      if (secretName.startsWith('DOPPLER_')) {
        skippedCount++
        continue
      }

      secretsMap.set(secretName, secretsParsed.secrets[secretName].raw)
    }

    log.debug(
      `Parsed ${secretsMap.size} secrets from Doppler response (skipped ${skippedCount} DOPPLER_ prefixed secrets)`
    )

    return secretsMap
  }

  /**
   * Fetches secrets by name from Doppler.
   *
   * If requireAll is true, and any of the requested secrets are not found, an error is thrown.
   * If requireAll is false (default), and any of the requested secrets are not found, they are logged as warnings.
   */
  async getSecrets(
    secretNames: string[],
    requireAll: boolean = false
  ): Promise<Map<string, string>> {
    log.debug(
      `Requesting ${secretNames.length} secrets from Doppler: [${secretNames.join(', ')}]`
    )
    log.debug(`RequireAll mode: ${requireAll}`)

    const secretsMap = await this.fetchSecrets()
    const foundSecrets = secretNames.filter((secretName) =>
      secretsMap.has(secretName)
    )
    const missingSecrets = secretNames.filter(
      (secretName) => !secretsMap.has(secretName)
    )

    log.debug(
      `Found ${foundSecrets.length}/${secretNames.length} requested secrets`
    )
    if (foundSecrets.length > 0) {
      log.debug(`Available secrets: [${foundSecrets.join(', ')}]`)
    }

    if (missingSecrets.length > 0) {
      log.debug(`Missing secrets: [${missingSecrets.join(', ')}]`)
      if (requireAll) {
        log.error(`Missing required secrets: ${missingSecrets.join(', ')}`)
        throw new Error(
          `Missing required secrets: ${missingSecrets.join(', ')}`
        )
      } else {
        log.warn(
          `Missing requested optional secrets: ${missingSecrets.join(', ')}`
        )
      }
    }

    // Return only the requested secrets that were found
    const requestedSecretsMap = new Map<string, string>()
    for (const secretName of foundSecrets) {
      requestedSecretsMap.set(secretName, secretsMap.get(secretName)!)
    }

    log.debug(`Returning ${requestedSecretsMap.size} secrets`)
    return requestedSecretsMap
  }

  async syncProcessEnvironment(): Promise<void> {
    const secretsMap = await this.fetchSecrets()

    // Forcibly export it to the environment so that a subsequent library can pick it up.
    for (const [secretName, secretValue] of secretsMap.entries()) {
      log.debug(`Syncing secret ${secretName} to process environment`)
      process.env[secretName] = secretValue
    }

    log.info(`Synced ${secretsMap.size} secrets to process environment`)
  }

  private get doppler(): DopplerSDK {
    if (!this.isInitialized()) {
      throw new Error('Doppler Secrets Manager not initialized')
    }
    return this.client!
  }

  async getSecretNames(): Promise<string[]> {
    const secretsMap = await this.fetchSecrets()
    return Array.from(secretsMap.keys())
  }

  async hasSecret(secretName: string): Promise<boolean> {
    const secretsMap = await this.fetchSecrets()
    return secretsMap.has(secretName)
  }

  async getSecret(secretName: string): Promise<string> {
    const secretsMap = await this.fetchSecrets()
    const secretValue = secretsMap.get(secretName)
    if (!secretValue) {
      throw new Error(`Secret ${secretName} not found`)
    }
    return secretValue
  }
}

export async function createDopplerSecretManager(
  apiClient: OneGrepApiClient
): Promise<DopplerSecretManager> {
  const secretManager = new DopplerSecretManager(apiClient)
  await secretManager.initialize()
  return secretManager
}

export async function getDopplerSecretManager(): Promise<DopplerSecretManager> {
  return await createDopplerSecretManager(clientFromConfig())
}
