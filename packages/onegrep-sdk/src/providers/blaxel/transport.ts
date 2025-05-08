import { env } from 'process'

import { BlaxelMcpClientTransport, settings } from '@blaxel/core'
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import { log } from '~/core/log.js'

export type BlaxelSettings = typeof settings

/**
 * Utility class for getting the Blaxel MCP client transport URLs.
 *
 * Extracted from SDK code here:
 * https://github.com/beamlit/sdk-typescript/blob/9c5a363d705cd1ad49e829a4f02c33a788831294/src/tools/mcpTool.ts#L36
 */
class BlaxelUrlUtils {
  // Name is the name of the Blaxel function
  constructor(
    private readonly name: string,
    private readonly blaxelSettings: BlaxelSettings
  ) {}

  get fallbackUrl() {
    if (this.externalUrl != this.url) {
      return this.externalUrl
    }
    return null
  }

  get externalUrl() {
    const envVar = this.name.replace(/-/g, '_').toUpperCase()
    if (env[`BL_FUNCTION_${envVar}_URL`]) {
      return new URL(env[`BL_FUNCTION_${envVar}_URL`] as string)
    }
    return new URL(
      `${this.blaxelSettings.runUrl}/${this.blaxelSettings.workspace}/functions/${this.name}`
    )
  }

  get url() {
    const envVar = this.name.replace(/-/g, '_').toUpperCase()
    if (env[`BL_FUNCTION_${envVar}_URL`]) {
      return new URL(env[`BL_FUNCTION_${envVar}_URL`] as string)
    }
    if (env[`BL_FUNCTION_${envVar}_SERVICE_NAME`]) {
      return new URL(
        `https://${env[`BL_FUNCTION_${envVar}_SERVICE_NAME`]}.${
          this.blaxelSettings.runInternalHostname
        }`
      )
    }
    return this.externalUrl
  }
}

/**
 * Creates a Blaxel MCP client transport and fallback transport.
 *
 * Extracted from SDK code here:
 * https://github.com/beamlit/sdk-typescript/blob/9c5a363d705cd1ad49e829a4f02c33a788831294/src/tools/mcpTool.ts#L92
 */
export function createBlaxelMcpClientTransports(
  functionName: string,
  providedSettings?: BlaxelSettings,
  headerOverrides?: Record<string, string>
): Transport[] {
  const useSettings = providedSettings ?? settings

  const urlUtils = new BlaxelUrlUtils(functionName, useSettings)
  const url = urlUtils.url.toString()
  const fallbackUrl = urlUtils.fallbackUrl?.toString()
  log.trace('BlaxelMcpClientTransports urls', { url, fallbackUrl })

  const transportHeaders = headerOverrides ?? useSettings.headers
  log.trace('BlaxelMcpClientTransports headers', transportHeaders)

  const transports = [new BlaxelMcpClientTransport(url, transportHeaders)]
  if (fallbackUrl) {
    transports.push(new BlaxelMcpClientTransport(fallbackUrl, transportHeaders))
  }
  return transports
}
