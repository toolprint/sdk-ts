import {
  getLogger,
  loggingSchema,
  getConfigDir as getConfigDirUtils,
  initConfigDir as initConfigDirUtils,
  getEnv,
  getEnvIssues
} from '@repo/utils'

export { getEnv, getEnvIssues }

export const getChildLogger = (loggerName: string, logLevelName?: string) => {
  const env = getEnv(loggingSchema)
  return getLogger(env.LOG_MODE, loggerName, logLevelName)
}

export const getConfigDir = () => {
  return getConfigDirUtils()
}

export const initConfigDir = () => {
  return initConfigDirUtils()
}
