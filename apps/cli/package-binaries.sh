#!/bin/sh
set -e

# Configuration
VERSION=$(node -e "console.log(require('./package.json').version)")
OUTPUT_DIR="./bin"
NODE_VERSION="20.11.1" # Choose a stable LTS version

# Create output directory
mkdir -p $OUTPUT_DIR

# Use specific paths that we know exist
ARM64_NODE="$OUTPUT_DIR/node-v$NODE_VERSION-darwin-arm64/bin/node"
if [ ! -f "$ARM64_NODE" ]; then
  ARM64_NODE="$OUTPUT_DIR/node-20.11.1-darwin-arm64/node-v20.11.1-darwin-arm64/bin/node"
fi

X64_NODE="$OUTPUT_DIR/node-v$NODE_VERSION-darwin-x64/bin/node"
if [ ! -f "$X64_NODE" ]; then
  X64_NODE="$OUTPUT_DIR/node-20.11.1-darwin-x64/node-v20.11.1-darwin-x64/bin/node"
fi

LINUX_NODE="$OUTPUT_DIR/node-v$NODE_VERSION-linux-x64/bin/node"

# Download Node.js binaries if needed
download_node_if_needed() {
  platform=$1
  arch=$2
  extracted_dir="$OUTPUT_DIR/node-v$NODE_VERSION-$platform-$arch"
  
  if [ ! -d "$extracted_dir" ]; then
    echo "Downloading Node.js $NODE_VERSION for $platform-$arch..."
    
    if [ "$platform" = "darwin" ]; then
      curl -L "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-$platform-$arch.tar.gz" | tar xz -C "$OUTPUT_DIR"
    else
      curl -L "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-$platform-$arch.tar.xz" | tar xJ -C "$OUTPUT_DIR"
    fi
  else
    echo "Using existing Node.js download for $platform-$arch"
  fi
}

# Generate the SEA blob
echo "Generating SEA blob..."
node --experimental-sea-config sea-config.json

# Build for macOS arm64
echo "Building for macOS arm64..."
download_node_if_needed "darwin" "arm64"

# Try to find the macOS arm64 binary
if [ ! -f "$ARM64_NODE" ]; then
  ARM64_NODE=$(find "$OUTPUT_DIR" -type f -name "node" | grep arm64 | head -1)
fi

if [ ! -f "$ARM64_NODE" ]; then
  echo "❌ Error: Could not find node binary for macOS arm64"
  echo "Debug info:"
  find "$OUTPUT_DIR" -type f -name "node" | cat
  ls -la "$OUTPUT_DIR"
  exit 1
fi

echo "Found Node.js binary at: $ARM64_NODE"
OUTPUT_BIN="$OUTPUT_DIR/onegrep-cli-darwin-arm64-$VERSION"

# Copy the Node.js binary and prepare it
echo "Copying node binary from $ARM64_NODE to $OUTPUT_BIN"
cp "$ARM64_NODE" "$OUTPUT_BIN"
chmod +x "$OUTPUT_BIN"

# On macOS, we need to remove the signature before modifying the binary
if [ "$(uname)" = "Darwin" ]; then
  codesign --remove-signature "$OUTPUT_BIN"
fi

# Inject the SEA blob
npx postject "$OUTPUT_BIN" NODE_SEA_BLOB bin/sea-prep.blob \
  --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 \
  --macho-segment-name NODE_SEA

# Re-sign the binary
if [ "$(uname)" = "Darwin" ]; then
  codesign --sign - "$OUTPUT_BIN"
fi

echo "✅ Created $OUTPUT_BIN"

# Build for macOS x64
echo "Building for macOS x64..."
download_node_if_needed "darwin" "x64"

# Try to find the macOS x64 binary
if [ ! -f "$X64_NODE" ]; then
  X64_NODE=$(find "$OUTPUT_DIR" -type f -name "node" | grep x64 | head -1)
fi

if [ ! -f "$X64_NODE" ]; then
  echo "❌ Error: Could not find node binary for macOS x64"
  echo "Debug info:"
  find "$OUTPUT_DIR" -type f -name "node" | cat
  ls -la "$OUTPUT_DIR"
  exit 1
fi

echo "Found Node.js binary at: $X64_NODE"
OUTPUT_BIN="$OUTPUT_DIR/onegrep-cli-darwin-x64-$VERSION"

# Copy the Node.js binary and prepare it
echo "Copying node binary from $X64_NODE to $OUTPUT_BIN"
cp "$X64_NODE" "$OUTPUT_BIN"
chmod +x "$OUTPUT_BIN"

# On macOS, we need to remove the signature before modifying the binary
if [ "$(uname)" = "Darwin" ]; then
  codesign --remove-signature "$OUTPUT_BIN"
fi

# Inject the SEA blob
npx postject "$OUTPUT_BIN" NODE_SEA_BLOB bin/sea-prep.blob \
  --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 \
  --macho-segment-name NODE_SEA

# Re-sign the binary
if [ "$(uname)" = "Darwin" ]; then
  codesign --sign - "$OUTPUT_BIN"
fi

echo "✅ Created $OUTPUT_BIN"

# Build for Linux x64
echo "Building for Linux x64..."
# Note: This will only work correctly if built on Linux or using a cross-platform approach
if [ "$(uname)" != "Darwin" ]; then
  download_node_if_needed "linux" "x64"
  
  if [ ! -f "$LINUX_NODE" ]; then
    LINUX_NODE=$(find "$OUTPUT_DIR" -type f -name "node" | grep linux | head -1)
  fi
  
  if [ ! -f "$LINUX_NODE" ]; then
    echo "❌ Error: Could not find node binary for Linux x64"
    echo "Debug info:"
    find "$OUTPUT_DIR" -type f -name "node" | cat
    ls -la "$OUTPUT_DIR"
    exit 1
  fi
  
  echo "Found Node.js binary at: $LINUX_NODE"
  OUTPUT_BIN="$OUTPUT_DIR/onegrep-cli-linux-x64-$VERSION"
  
  # Copy the Node.js binary and prepare it
  echo "Copying node binary from $LINUX_NODE to $OUTPUT_BIN"
  cp "$LINUX_NODE" "$OUTPUT_BIN"
  chmod +x "$OUTPUT_BIN"
  
  # Inject the SEA blob
  npx postject "$OUTPUT_BIN" NODE_SEA_BLOB bin/sea-prep.blob \
    --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
  
  echo "✅ Created $OUTPUT_BIN"
else
  echo "⚠️ Skipping Linux build on macOS. Run on Linux or in Docker to build Linux binaries."
fi

# Generate checksums
echo "Generating checksums..."
if [ -f "$OUTPUT_DIR/onegrep-cli-darwin-arm64-$VERSION" ]; then
  shasum -a 256 "$OUTPUT_DIR/onegrep-cli-darwin-arm64-$VERSION" > "$OUTPUT_DIR/onegrep-cli-darwin-arm64-$VERSION.sha256"
fi

if [ -f "$OUTPUT_DIR/onegrep-cli-darwin-x64-$VERSION" ]; then
  shasum -a 256 "$OUTPUT_DIR/onegrep-cli-darwin-x64-$VERSION" > "$OUTPUT_DIR/onegrep-cli-darwin-x64-$VERSION.sha256"
fi

if [ -f "$OUTPUT_DIR/onegrep-cli-linux-x64-$VERSION" ]; then
  shasum -a 256 "$OUTPUT_DIR/onegrep-cli-linux-x64-$VERSION" > "$OUTPUT_DIR/onegrep-cli-linux-x64-$VERSION.sha256"
fi

echo "✅ Build process completed!"