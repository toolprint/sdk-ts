import { z } from 'zod'
import 'dotenv/config'

export const nodeEnv = z.object({
  NODE_ENV: z
    .union([
      z.literal('test'),
      z.literal('development'),
      z.literal('production')
    ])
    .default('development')
})

export const logModes = z.enum(['off', 'console', 'file', 'all'])

export const loggingSchema = z.object({
  LOG_MODE: logModes.default('off'),
  LOG_LEVEL: z.string().default('info')
})

export const sdkApiSchema = z.object({
  ONEGREP_API_KEY: z.string().optional(),
  ONEGREP_API_URL: z.string().url().default('https://test-sandbox.onegrep.dev')
})

export const configSchema = z.object({
  ONEGREP_CONFIG_DIR: z.string().optional() // Default in config.ts to avoid importing filepath libs
})

export const loggingEnvSchema = nodeEnv.merge(loggingSchema)

export const envSchema = loggingEnvSchema.merge(sdkApiSchema)

/**
 * Get the environment variables for the given schema.
 * NOTE: Ensures any unrecognized environment variables are ignored.
 * @param envSchema - The schema to get the environment variables for.
 * @returns The environment variables for the given schema in a Zod inferred type.
 */
export function getEnv<T extends z.ZodObject<any, any>>(
  envSchema: T
): z.infer<T> {
  return envSchema.strip().parse(process.env)
}

/**
 * Get the issues from the environment variables for the given schema.
 * Use at the beginning of your program to check if the environment variables are valid.
 * NOTE: Ensures any unrecognized environment variables are ignored.
 * @param envSchema - The schema to get the issues from the environment variables for.
 * @returns The issues from the environment variables for the given schema.
 */
export const getEnvIssues = <T extends z.ZodObject<any, any>>(
  envSchema: T
): z.ZodIssue[] | void => {
  const result = envSchema.strip().safeParse(process.env)
  if (!result.success) return result.error.issues
}
