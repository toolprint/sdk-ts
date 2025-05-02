import { z } from 'zod'

import { loggingSchema, getEnv, getLogger } from '@repo/utils'

export const sdkLoggingSchema = loggingSchema.extend({
  ONEGREP_SDK_LOG_LEVEL: z.string().default('info')
})

const initSdkLogger = () => {
  const env = getEnv(sdkLoggingSchema)

  return getLogger(env.LOG_MODE, 'sdk', env.ONEGREP_SDK_LOG_LEVEL)
}

/**
 * The child logger for the onegrep-sdk.
 */
export const log = initSdkLogger()
