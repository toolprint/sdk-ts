# typescript-sdk

[![Release](https://img.shields.io/github/v/release/OneGrep/typescript-sdk)](https://img.shields.io/github/v/release/OneGrep/typescript-sdk)
[![Build status](https://img.shields.io/github/actions/workflow/status/OneGrep/typescript-sdk/main.yml?branch=main)](https://github.com/OneGrep/typescript-sdk/actions/workflows/main.yml?query=branch%3Amain)
[![codecov](https://codecov.io/gh/OneGrep/typescript-sdk/branch/main/graph/badge.svg)](https://codecov.io/gh/OneGrep/typescript-sdk)
[![Commit activity](https://img.shields.io/github/commit-activity/m/OneGrep/typescript-sdk)](https://img.shields.io/github/commit-activity/m/OneGrep/typescript-sdk)
[![License](https://img.shields.io/github/license/OneGrep/typescript-sdk)](https://img.shields.io/github/license/OneGrep/typescript-sdk)

OneGrep TypeScript SDK

- **Github repository**: <https://github.com/onegrep/typescript-sdk/>
- **Documentation** <https://onegrep.github.io/typescript-sdk/>

## 🚀 Getting Started

TODO: add getting started

### Prerequisites

- [Just](https://just.systems/) command runner
- [Node.js](https://nodejs.org/) (v22 or higher)
- [PNPM](https://pnpm.io/) (v10 or higher)

### Installation

## Initial setup

TODO: add installation example

## Run the Gateway

TODO: add gateway setup example

## What's inside?

This repository includes the following packages/apps:

## 🛠 Tech Stack

- **Build System**: [Turborepo](https://turborepo.org/)
- **Package Manager**: [PNPM](https://pnpm.io/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Bundle**: [tsup](https://tsup.egoist.dev/)
- **Task Runner**: [Just](https://just.systems/)

## 📦 Project Structure

TODO: add project structure

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting
- [Husky](https://typicode.github.io/husky/#/) for git hooks

### Build

To build all apps and packages, run the following command:

```
just build
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
- [Caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching)
- [Filtering](https://turbo.build/repo/docs/core-concepts/monorepos/filtering)
- [Configuration Options](https://turbo.build/repo/docs/reference/configuration)
- [CLI Usage](https://turbo.build/repo/docs/reference/command-line-reference)

## 📚 Documentation

For more detailed documentation about each package, please refer to their respective README files:

- [OneGrep SDK](packages/onegrep-sdk/README.md)
- [OneGrep Gateway](apps/onegrep-gateway/README.md)
- [N8N Nodes](packages/n8n-nodes-onegrep/README.md)

## Additional Notes

- All packages in the repo that are part of a `pnpm pack` dependency chain must have a version (even if it's 0.0.0). [Related issue](https://github.com/pnpm/pnpm/issues/4164#issuecomment-1236762286)

- Pino v7-9 depends on thread-stream, which is not bundled in CJS automatically. Additionally, for some runtimes (like n8n), which use CommonJS, it's not easy to load Pino with dynamic imports, so we don't bundle it directly and expose it as a peer dependency. If Pino is not present, we fallback to logging to the console (which is not ideal for the Gateway running in MCP stdio mode).

## 📝 License

[MIT](LICENSE)
