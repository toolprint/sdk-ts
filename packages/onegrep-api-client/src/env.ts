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
  LOG_LEVEL: z.string().default('info'),
  LOG_MODE: z.enum(['stdout', 'file']).default('stdout'),
  LOG_FILEPATH: z.string().optional(),
  ONEGREP_API_KEY: z.string().min(1),
  ONEGREP_API_URL: z.string().url().default('https://api.onegrep.dev')
})

export type Env = z.infer<typeof envSchema>

export function getEnv(): Env {
  return envSchema.parse(process.env)
}
