# OneGrep CLI

Use the OneGrep CLI to check connectivity, check the state of your integrations, and to test your tools.

## Setup

1. Build the project from root. Navigate to the parent directory of the typescript-sdk and run `just build`.

2. Navigate back to the `apps/cli` directory and add a `.env` file in this directory and include the following environment variables - replace the values appropriately.

```
ONEGREP_API_KEY: abc123...
ONEGREP_API_URL: mydomain.onegrep.dev
```

3. Run the CLI from the `apps/cli` directory:

```bash
pnpm exec onegrep-cli healthcheck
```
