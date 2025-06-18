import { defineConfig } from 'tsup'

// ! Currently unused, doesn't play well with how @hey-api/openapi-ts generates the client
export default defineConfig({
  entry: ['src/*/index.ts'],
  noExternal: ['@repo'], // Bundle any package starting with `@repo` and their dependencies
  external: ['@hey-api/client-axios'],
  splitting: false,
  bundle: false,
  outDir: './dist',
  clean: true,
  env: { IS_SERVER_BUILD: 'true' },
  loader: { '.json': 'copy' },
  minify: false,
  sourcemap: true,
  format: ['cjs', 'esm'],
  dts: true,
  outExtension({ format }) {
    return format === 'esm' ? { js: '.js' } : { js: '.cjs' }
  }
})
