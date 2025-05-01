import DopplerSDK, { NamesResponse } from '@dopplerhq/node-sdk'

import { SecretManager } from './types.js'

import { OneGrepApiClient } from '~/core/index.js'
import { OneGrepApiHighLevelClient } from '~/core/index.js'
import { clientFromConfig } from '~/core/index.js'

/**
 * A secret manager that uses pre-configured Doppler to store and retrieve SDK secrets.
 *
 * Configuration is driven by the OneGrep API based on the currently authenticated user.
 */
export class DopplerSecretManager implements SecretManager {
  private apiClient: OneGrepApiClient
  private highLevelClient: OneGrepApiHighLevelClient

  private dopplerSDK: DopplerSDK | undefined
  private dopplerProject: string | undefined
  private dopplerConfig: string | undefined

  constructor(apiClient: OneGrepApiClient) {
    this.apiClient = apiClient
    this.highLevelClient = new OneGrepApiHighLevelClient(this.apiClient)
    this.dopplerSDK = undefined
  }

  async initialize(): Promise<void> {
    const initResponse = await this.highLevelClient.initialize()
    const orgId = initResponse.org_id

    // TODO: Return from initialize
    this.dopplerProject = 'onegrep-sdk' //initResponse.doppler_project
    this.dopplerConfig = `dev_org-id_${orgId}` //initResponse.doppler_config

    const serviceToken = initResponse.doppler_service_token

    if (!serviceToken || typeof serviceToken !== 'string') {
      throw new Error(
        'Use the CLI to generate a service token for this principal'
      )
    }

    this.dopplerSDK = new DopplerSDK({ accessToken: serviceToken })
  }

  private isInitialized(): boolean {
    return (
      this.dopplerSDK !== undefined &&
      this.dopplerProject !== undefined &&
      this.dopplerConfig !== undefined
    )
  }

  private get project(): string {
    if (!this.isInitialized()) {
      throw new Error('Doppler Secrets Manager not initialized')
    }
    return this.dopplerProject!
  }

  private get config(): string {
    if (!this.isInitialized()) {
      throw new Error('Doppler Secrets Manager not initialized')
    }
    return this.dopplerConfig!
  }

  private get doppler(): DopplerSDK {
    if (!this.isInitialized()) {
      throw new Error('Doppler Secrets Manager not initialized')
    }
    return this.dopplerSDK!
  }

  async getSecretNames(): Promise<string[]> {
    const secret_names: NamesResponse = await this.doppler.secrets.names(
      this.project,
      this.config
    )
    return secret_names.names ?? []
  }

  async getSecret(secretName: string): Promise<string> {
    const secret = await this.doppler.secrets.get(
      this.project,
      this.config,
      secretName
    )
    if (!secret.value?.computed) {
      throw new Error(`Secret ${secretName} has no value`)
    }
    return secret.value.computed
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
