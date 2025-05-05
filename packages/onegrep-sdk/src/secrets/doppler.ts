import DopplerSDK from '@dopplerhq/node-sdk'

import { SecretManager } from './types.js'

import { InitializeResponse, OneGrepApiClient } from '~/core/index.js'
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
    const initResponse: InitializeResponse =
      await this.highLevelClient.initialize()

    // ? If none of these get vended, this will error out.
    this.serviceToken = initResponse.doppler_service_token as string
    this.project = initResponse.doppler_project as string
    this.config = initResponse.doppler_config as string

    this.client = new DopplerSDK({ accessToken: this.serviceToken })
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
      throw new Error('Doppler Secrets Manager not initialized')
    }

    const secrets = await this.doppler.secrets.list(this.project!, this.config!)
    if (!secrets.secrets) {
      log.debug('No secrets discovered from doppler secrets manager')
    }

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
    for (const secretName in secretsParsed.secrets) {
      // Doppler secrets.list returns DOPPLER_ prefixed secrets for some reason so we'll skip them.
      if (secretName.startsWith('DOPPLER_')) {
        continue
      }

      secretsMap.set(secretName, secretsParsed.secrets[secretName].raw)
    }

    return secretsMap
  }

  async syncProcessEnvironment(): Promise<void> {
    const secretsMap = await this.fetchSecrets()

    // Forcibly export it to the environment so that a subsequent library can pick it up.
    for (const [secretName, secretValue] of secretsMap.entries()) {
      process.env[secretName] = secretValue
    }
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
