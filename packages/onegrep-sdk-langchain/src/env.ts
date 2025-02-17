import { z } from 'zod'

const envSchema = z.object({
  ONEGREP_API_KEY: z.string().min(1),
  ONEGREP_API_URL: z.string().url().default('https://api.onegrep.dev'),
  ENV: z
    .union([
      z.literal('local'),
      z.literal('dev'),
      z.literal('test'),
      z.literal('prod')
    ])
    .default('local')
})

const env = envSchema.parse(process.env)

export default env
