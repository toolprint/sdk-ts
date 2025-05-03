import { z } from 'zod'

import {
  getLogger,
  loggingSchema,
  getConfigDir as getConfigDirUtils,
  initConfigDir as initConfigDirUtils,
  getEnv as getEnvUtils,
  getEnvIssues as getEnvIssuesUtils
} from '@repo/utils'

export function getEnv<T extends z.ZodObject<any, any>>(
  envSchema: T
): z.infer<T> {
  return getEnvUtils(envSchema)
}

export const getEnvIssues = <T extends z.ZodObject<any, any>>(
  envSchema: T
): z.ZodIssue[] | void => {
  return getEnvIssuesUtils(envSchema)
}

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
