import { z } from 'zod'
import 'dotenv/config'

const envSchema = z.object({
  ENV: z
    .union([
      z.literal('test'),
      z.literal('development'),
      z.literal('production')
    ])
    .default('development'),
  LOG_MODE: z.enum(['silent', 'console', 'pino', 'debug']).default('console'),
  LOG_LEVEL: z.string().default('info'),
  PINO_LOG_TRANSPORT: z.enum(['stdout', 'file']).default('stdout'),
  PINO_LOG_FILEPATH: z.string().optional(),
  ONEGREP_API_KEY: z.string().optional(),
  ONEGREP_API_URL: z.string().url().default('https://test-sandbox.onegrep.dev')
})

export type Env = z.infer<typeof envSchema>

export function getEnv(): Env {
  return envSchema.parse(process.env)
}
