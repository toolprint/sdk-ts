import os from 'os'
import fs from 'fs'
import { join } from 'path'

import { settings as blaxelSettings } from '@blaxel/sdk'

import { getDopplerSecretManager } from '~/secrets/doppler.js'

/**
 * ! Reccommend against using this class.
 *
 * This class is used to override the Blaxel settings in the user's home directory.
 *
 * This is a hack and should be removed once we have a more reliable way to create API clients.
 */
class BlaxelSettingsOverrider {
  private workspace: string | undefined
  private apiKey: string | undefined

  constructor(apiKey: string, workspace: string) {
    this.apiKey = apiKey
    this.workspace = workspace
  }

  private constructConfigYaml(): string {
    return `
      context:
        workspace: ${this.workspace}
      workspaces:
        - name: ${this.workspace}
          credentials:
            apiKey: ${this.apiKey}
      `
  }

  sync() {
    const configYaml = this.constructConfigYaml()

    const homeDir = os.homedir()
    fs.writeFileSync(join(homeDir, '.blaxel/config.yaml'), configYaml)

    console.log('Synced Blaxel settings', configYaml)
  }
}

/**
 * ! Reccommend against using this function.
 *
 * This function is used to forcibly re-authenticate the Blaxel SDK.
 *
 * This is a hack and should be removed once we have a more reliable way to create API clients.
 */
export async function syncBlaxelSettings(): Promise<void> {
  /** Syncs the config yaml used by the blaxel SDK with the environment variables a secrets
   * manager may have set in case the environment variables don't exist.
   */
  await blaxelSettings.authenticate()
  // We have to see if the blaxelsettings object is a validApiKey credential or a clientcredential.
  // If either is valid, we can skip the sync.
  const blaxelCredentials = JSON.parse(
    JSON.stringify(blaxelSettings.credentials)
  )
  if (blaxelCredentials.apiKey && blaxelCredentials.workspace) {
    console.log('Blaxel settings already loaded from api key. Skipping sync.')
    // It correctly loaded existing settings therefore we don't need to forcibly manipulate the blaxel settings.
    return
  } else if (
    blaxelCredentials.clientCredentials &&
    blaxelCredentials.workspace
  ) {
    console.log(
      'Blaxel settings already loaded from client credentials. Skipping sync.'
    )
    // It correctly loaded existing settings therefore we don't need to forcibly manipulate the blaxel settings.
    return
  }

  console.log('No existing blaxel settings found. Syncing Blaxel settings...')

  const secretManager = await getDopplerSecretManager()
  await secretManager.initialize()
  const bl_workspace = await secretManager.getSecret('BL_WORKSPACE')
  const bl_api_key = await secretManager.getSecret('BL_API_KEY')
  console.log('Blaxel workspace', bl_workspace)
  const obfuscated_api_key = bl_api_key?.replace(/./g, '*')
  console.log('Blaxel api key', obfuscated_api_key)

  const override = new BlaxelSettingsOverrider(bl_api_key!, bl_workspace!)
  override.sync()

  // Force it to reload the settings
  await blaxelSettings.authenticate()
}
