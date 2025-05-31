#!/usr/bin/env -S just --justfile

# Node.js package.json script compatibility
# https://just.systems/man/en/nodejs-packagejson-script-compatibility.html
export PATH := "./node_modules/.bin:" + env_var('PATH')

_default:
    just -l -u

# install dependencies
[group('install')]
install:
    pnpm install

# clean and fresh install dependencies
[group('install')]
reinstall:
    just clean
    just install

# update the api client spec
[group('openapi')]
update-openapi-spec base-url="https://www.test-sandbox.onegrep.dev":
    curl {{base-url}}/openapi/sdk-client.yaml --output ./packages/onegrep-api-client/openapi/onegrep-api.yaml

[group('openapi')]
update-openapi-spec-local:
    just update-openapi-spec "http://localhost:8080"

# generate code for all packages
[group('generate')]
generate:
    pnpm turbo run generate --force
    ./fix-api-client.sh # ! There's a bug in the api client generator for discriminated unions

# prettier format code for all packages
[group('format')]
format:
    pnpm format

# lint code for all packages
[group('lint')]
lint:
    pnpm turbo run lint

# fix lint errors for all packages
[group('lint')]
lint-fix:
    pnpm turbo run lint:fix

# build all packages (using turbo cache)
[group('build')]
build:
    pnpm turbo run build

# build all packages (force rebuild)
[group('build')]
rebuild:
    pnpm turbo run build --force

# build the utils package
[group('build')]
build-utils:
    pnpm turbo run build --force --filter=@repo/utils

# build the api client package
[group('build')]
build-api-client:
    pnpm turbo run build --force --filter=@repo/onegrep-api-client

# build the sdk package
[group('build')]
build-sdk:
    pnpm turbo run build --force --filter=@onegrep/sdk

# check types
[group('check')]
check-types:
    pnpm turbo run check-types

# dev
[group('dev')]
dev:
    pnpm turbo run dev --filter=@onegrep/gateway

# dev n8n
[group('dev')]
dev-n8n:
    pnpm turbo run dev --filter=@onegrep/sdk/n8n-nodes-onegrep

# tail all onegrep logs
[group('logs')]
tail-logs:
    multitail -q 1 ~/.onegrep/*.log

# tail the sdk log
[group('logs')]
tail-sdk-logs:
    tail -F ~/.onegrep/onegrep.sdk.log

# clear logs
[group('logs')]
clear-logs:
    rm -f ~/.onegrep/*.log

# blaxel serve agent
[group('blaxel')]
bl-serve:
    cd apps/examples/blaxel/langgraph-agent && pnpm bl:serve

# open blaxel chat for local agent
[group('blaxel')]
bl-chat:
    cd apps/examples/blaxel/langgraph-agent && pnpm bl:chat

# start the gateway
[group('gateway')]
gateway:
    pnpm turbo run start --filter=@onegrep/gateway

# test all packages (use `test name=".*"` to filter by test name regex)
[group('test')]
test name=".*":
    pnpm turbo run test -- --testNamePattern={{name}}

[group('test')]
test-api-client name=".*":
    pnpm turbo run test --filter=@repo/onegrep-api-client -- --testNamePattern={{name}}

# test the sdk package (use `test-sdk ".*"` to filter by test name regex)
# * Note that "name" isn't the file name but the name of the test class within a file.
# Example to filter to langchain tests: `just test-sdk ".*Langchain.*"` or `just test-sdk ".*Blaxel.*"`
[group('test')]
test-sdk name=".*":
    pnpm turbo run test --filter=@onegrep/sdk -- --testNamePattern={{name}}

# inspect the gateway
[group('mcp-inspector')]
inspect:
    just inspect-sse

# inspect the gateway with sse
[group('mcp-inspector')]
inspect-sse:
    pnpm turbo run dev --filter=@onegrep/gateway inspector:sse

# inspect the gateway with stdio
[group('mcp-inspector')]
inspect-stdio:
    pnpm turbo run inspector:stdio

# generate licenses
[group('licenses')]
licenses:
    pnpm turbo run licenses

# pre-commit hooks
[group('check')]
pre-commit:
    .husky/pre-commit

# commit message hooks
[group('check')]
commit-msg:
    .husky/commit-msg

# package the sdk
[group('package')]
pack:
    pnpm turbo run package

# version the sdk
[group('version')]
version-sdk:
    pnpm turbo run version --filter=@onegrep/sdk

# publish the sdk
[group('publish')]
publish-sdk:
    pnpm turbo run publish:npm --filter=@onegrep/sdk

# publish the sdk (dry run)
[group('publish')]
publish-sdk-dry-run:
    pnpm turbo run publish:npm:dry-run --filter=@onegrep/sdk

# publish the api client
[group('publish')]
publish-api-client:
    pnpm turbo run publish:npm --filter=@onegrep/api-client

# publish the api client (dry run)
[group('publish')]
publish-api-client-dry-run:
    pnpm turbo run publish:npm:dry-run --filter=@onegrep/api-client

# clean dist folders
[group('clean')]
clean-dist:
    pnpm turbo run clean:dist

# clean node_modules folders
[group('clean')]
clean-modules:
    pnpm turbo run clean:modules

# clean all
[group('clean')]
clean:
    pnpm turbo run clean
