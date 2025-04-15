# OneGrep CLI Development Guide

This document contains instructions for developing, building, and distributing the OneGrep CLI.

## Building Binaries for Distribution

### Prerequisites

- Node.js 20+ installed
- Access to OneGrep repositories

### Step 1: Bump the Version

Before creating new binaries, update the version in `package.json`:

```bash
# Manually edit package.json or use npm version
npm version patch # or minor, or major
```

### Step 2: Generate the Binaries

Run the packaging script to create the binaries:

```bash
# Generate macOS binaries (both ARM64 and x64)
./package-binaries.sh

# The binaries will be created in the bin directory:
# - bin/onegrep-cli-darwin-arm64-[version]
# - bin/onegrep-cli-darwin-x64-[version]
# - bin/onegrep-cli-darwin-arm64-[version].sha256
# - bin/onegrep-cli-darwin-x64-[version].sha256
```

#### Linux Binaries

> **Note:** Support for building Linux binaries is coming soon. This will allow for distribution to Linux users via Homebrew.

### Step 3: Upload Binaries to Public GCS Bucket

Upload the generated binaries to our public Google Cloud Storage bucket:

#### Option 1: Using gsutil

If you have the Google Cloud SDK installed and configured:

```bash
gsutil cp bin/onegrep-cli-darwin-arm64-[version] gs://onegrep-homebrew-formulae/
gsutil cp bin/onegrep-cli-darwin-x64-[version] gs://onegrep-homebrew-formulae/
gsutil cp bin/onegrep-cli-darwin-arm64-[version].sha256 gs://onegrep-homebrew-formulae/
gsutil cp bin/onegrep-cli-darwin-x64-[version].sha256 gs://onegrep-homebrew-formulae/

# Make the files publicly accessible
gsutil acl ch -u AllUsers:R gs://onegrep-homebrew-formulae/cli/[version]/*
```

#### Option 2: Manual Upload via GCP Console

1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/)
2. Go to the "Storage" section
3. Browse to the `onegrep-homebrew-formulae` bucket
4. Upload all the binaries and their corresponding SHAs to the bucket in the root.

Ensure all files are publicly accessible for Homebrew installation to work correctly.

### Step 4: Update the Homebrew Formula

Follow the instructions in the [homebrew-tap repository](https://github.com/OneGrep/homebrew-tap/blob/main/DEVELOPMENT.md) to make the CLI distributable via Homebrew.

This typically involves:

1. Updating the formula file with the new version
2. Updating the download URLs to point to the new binaries
3. Updating the SHA256 checksums from the `.sha256` files
4. Committing and pushing the changes to the homebrew-tap repository

## Testing the Installation

After updating the Homebrew formula, test the installation:

```bash
# Update Homebrew
brew update

# If you haven't added the tap before:
brew tap onegrep/tap

# Install or upgrade the CLI
brew install onegrep/tap/onegrep-cli
# or
brew upgrade onegrep/tap/onegrep-cli

# Verify the installation
onegrep --version
```

## Troubleshooting

### Binary Generation Issues

- Ensure you have the correct Node.js version installed
- Make sure all dependencies are installed with `npm install`
- Check that the `sea-config.json` file is properly configured

### Homebrew Formula Issues

- Verify that the SHA256 checksums in the formula match the actual files
- Ensure the GCS bucket permissions allow public access to the files
- Check that the URLs in the formula are correct and accessible
