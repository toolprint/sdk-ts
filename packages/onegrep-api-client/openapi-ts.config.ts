import path from 'path'
import * as url from 'node:url'
import { defineConfig, defaultPlugins } from '@hey-api/openapi-ts'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  input: {
    path: 'openapi/onegrep-api.yaml',
    filters: {
      orphans: false
    }
  },
  output: {
    path: 'src',
    tsConfigPath: path.join(__dirname, 'tsconfig.json'), // ! https://github.com/hey-api/openapi-ts/issues/478#issuecomment-2851636116
    format: 'prettier',
    lint: false
  },
  plugins: [
    ...defaultPlugins,
    '@hey-api/client-axios',
    'zod',
    {
      // Recommended by HeyAPI: https://heyapi.dev/openapi-ts/output/typescript#enums
      // https://dev.to/ivanzm123/dont-use-enums-in-typescript-they-are-very-dangerous-57bh
      name: '@hey-api/typescript',
      enums: 'javascript'
    },
    {
      name: '@hey-api/sdk',
      asClass: true,
      validator: true
    },
    {
      name: '@hey-api/schemas',
      type: 'json'
    }
  ]
})
