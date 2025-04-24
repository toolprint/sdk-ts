#!/usr/bin/env -S just --justfile

# Node.js package.json script compatibility
# https://just.systems/man/en/nodejs-packagejson-script-compatibility.html
export PATH := "./node_modules/.bin:" + env_var('PATH')

_default:
    just -l -u

install:
    pnpm install

reinstall:
    just clean
    just install

generate:
    pnpm turbo run generate

format:
    pnpm format

lint:
    pnpm turbo run lint

lint-fix:
    pnpm turbo run lint:fix

build:
    pnpm turbo run build

build-api-client:
    pnpm turbo run build --force --filter=@repo/onegrep-api-client

build-sdk:
    pnpm turbo run build --force --filter=@onegrep/sdk

rebuild:
    pnpm turbo run build --force

build-types:
    pnpm turbo run build:types

build-cjs:
    pnpm turbo run build:cjs

build-esm:
    pnpm turbo run build:esm

build-utils:
    pnpm turbo run build --filter=@repo/utils

check-types:
    pnpm turbo run check-types

dev:
    pnpm turbo run dev --filter=@onegrep/gateway

dev-n8n:
    pnpm turbo run dev --filter=@onegrep/sdk/n8n-nodes-onegrep

gateway:
    pnpm turbo run start --filter=@onegrep/gateway

test-sdk:
    pnpm turbo run test --filter=@onegrep/sdk

test-sdk-blaxel:
    cd packages/onegrep-sdk && pnpm test-debug src/blaxel/toolcache.test.ts --run --testNamePattern="BlaxelToolCacheTests"

test-langchain:
    pnpm turbo run test --filter=@onegrep/langchain -- -v

test:
    pnpm turbo run test

inspect:
    just inspect-sse

inspect-sse:
    pnpm turbo run dev --filter=@onegrep/gateway inspector:sse

inspect-stdio:
    pnpm turbo run inspector:stdio

licenses:
    pnpm turbo run licenses

pre-commit:
    .husky/pre-commit

commit-msg:
    .husky/commit-msg

pack:
    pnpm turbo run package

version-sdk:
    pnpm turbo run version --filter=@onegrep/sdk

publish-sdk-github:
    pnpm turbo run publish:github --filter=@onegrep/sdk

clean-dist:
    pnpm turbo run clean:dist

clean-dist-types:
    pnpm turbo run clean:dist:types

clean-dist-cjs:
    pnpm turbo run clean:dist:cjs

clean-dist-esm:
    pnpm turbo run clean:dist:esm

clean-modules:
    pnpm turbo run clean:modules

clean:
    pnpm turbo run clean
