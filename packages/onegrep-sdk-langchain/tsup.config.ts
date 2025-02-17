import { defineConfig } from 'tsup'

export default defineConfig([
  // build for node
  {
    name: 'node',
    entry: ['src/index.ts'],
    sourcemap: true,
    // we'll just manually "clean" the dist dir before running this (to avoid potential race conditions)
    clean: false,
    minify: false,
    platform: 'node',
    replaceNodeEnv: true,
    // now required because not defaulted anymore
    shims: true,
    // use rollup for build to get smaller bundle sizes with tree shaking
    treeshake: true,
    globalName: 'ThirdwebSDK',
    format: ['cjs', 'esm'],
    outDir: 'dist/node',
    banner: {
      js: `import "cross-fetch/dist/node-polyfill.js";`
    }
  }
])
