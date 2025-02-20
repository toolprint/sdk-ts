import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./index.ts'],
  noExternal: ['@repo'], // Bundle any package starting with `@repo` and their dependencies
  external: ['thread-stream', 'fs'], // https://github.com/pinojs/pino/blob/main/docs/bundling.md
  splitting: false,
  bundle: true,
  outDir: './dist',
  clean: true,
  env: { IS_SERVER_BUILD: 'true' },
  loader: { '.json': 'copy' },
  minify: true,
  sourcemap: true
})
