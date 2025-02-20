![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n8n-nodes-onegrep

This is an n8n community node. It lets you use [OneGrep Tools](https://onegrep.dev) in your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

- [Installation](#installation)
- [Credentials](#credentials)
- [Usage](#usage)
- [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

Use the package at [here](https://www.npmjs.com/package/n8n-nodes-onegrep).

## Credentials

Add your OneGrep API Key to the n8n credentials store.

TODO: add screenshot

## Usage

TODO: add usage instructions

### Example

TODO: add example

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)

## Development

## Node Runtime

n8n currently requires Node <=22 at runtime.

### Naming Conventions

The linter enforces the following naming conventions:

- `credentials/{CapitalizedCredentialName}.credentials.cjs`
- `nodes/{lowercase-node-name}/{CapitalizedNodeName}.node.cjs`

Then on the package.json, you must define two _separate_ files, one for credentials and one for the node. It appears that it isn't support to have a single file for both, which is unfortunate because it's best if we bundle everything together for distribution in this case. Thus, we have a packaging post-processing step to fit the naming conventions.

### Packaging Support

According to [this issue](https://github.com/n8n-io/n8n/issues/9464), n8n does not support ESM modules at this time. As such, we only support a CommonJS distribution.

## Licenses

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)
