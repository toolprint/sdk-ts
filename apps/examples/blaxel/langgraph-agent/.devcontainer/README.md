# Development Container for Sales KPI Reporter

This folder contains configuration for a development container that provides a consistent TypeScript development environment.

## Features

- Node.js and TypeScript pre-installed
- ESLint and Prettier for code formatting and linting
- GitHub CLI for repository interactions
- Docker extension for container management
- Automatic port forwarding (3000)
- Blaxel CLI pre-installed for workspace management

## Getting Started

1. Ensure you have [VS Code](https://code.visualstudio.com/) and the [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension installed.
2. Open this repository in VS Code.
3. When prompted, click "Reopen in Container" or use the command palette (F1) and select "Remote-Containers: Reopen in Container".
4. VS Code will build the container and open the project inside it. This may take a few minutes the first time.
5. Once the container is running, you'll need to:
   - Create a `.env` file from `.env-sample` and add your API keys
   - Login to Blaxel with `bl login YOUR-WORKSPACE`
   - Apply your Blaxel configuration with `bl apply -R -f .blaxel` (if applicable)
6. You can now:
   - Use the integrated terminal to run TypeScript commands
   - Edit files with full TypeScript language support
   - Run and debug your application with Blaxel CLI `bl serve --hotreload`

## Customization

You can customize the development container by modifying the `devcontainer.json` file. Common customizations include:

- Adding additional VS Code extensions
- Changing Node.js/TypeScript versions
- Adding environment variables
- Installing additional tools

## Troubleshooting

If you encounter issues with the development container:

1. Rebuild the container using the command palette: "Remote-Containers: Rebuild Container"
2. Check that Docker is running properly on your system
3. Verify your VS Code Remote - Containers extension is up to date
4. If Blaxel CLI commands fail, try reinstalling with: `curl -fsSL https://raw.githubusercontent.com/beamlit/toolkit/main/install.sh | BINDIR=~/.local/bin sh`
