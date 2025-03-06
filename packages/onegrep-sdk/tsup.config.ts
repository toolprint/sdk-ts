import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/index.ts'],
  noExternal: ['@repo', '@onegrep/json-schema-to-zod'], // Bundle any package starting with `@repo` and their dependencies as well as our fork of json-schema-to-zod
  external: ['thread-stream'], // https://github.com/pinojs/pino/blob/main/docs/bundling.md
  splitting: false,
  bundle: true,
  clean: false,
  env: { IS_SERVER_BUILD: 'true' },
  loader: { '.json': 'copy' },
  minify: false,
  sourcemap: true
})
