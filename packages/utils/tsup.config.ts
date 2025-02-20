import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['./src/index.ts'],
  noExternal: [],
  external: ['thread-stream'], // https://github.com/pinojs/pino/blob/main/docs/bundling.md
  splitting: false,
  bundle: true,
  outDir: './dist',
  clean: false,
  env: { IS_SERVER_BUILD: 'true' },
  loader: { '.json': 'copy' },
  minify: false,
  sourcemap: true
})
