import { loggingSchema, getEnv, getLogger } from '@onegrep/sdk'

const initGatewayLogger = () => {
  const env = getEnv(loggingSchema)

  return getLogger(
    env.LOG_MODE,
    'gateway',
    process.env.ONEGREP_GATEWAY_LOG_LEVEL
  )
}

/**
 * The child logger for the onegrep-gateway.
 */
export const log = initGatewayLogger()
