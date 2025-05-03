import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  noExternal: ['@repo'], // Bundle any package starting with `@repo` and their dependencies
  external: ['fs'],
  splitting: false,
  bundle: true,
  outDir: './dist',
  clean: true,
  env: { IS_SERVER_BUILD: 'true' },
  loader: { '.json': 'copy' },
  minify: true,
  sourcemap: true,
  format: ['cjs'],
  dts: true
})
