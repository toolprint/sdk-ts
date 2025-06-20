#!/bin/bash
#
# This script syncs the root README.md to the packages/toolprint-sdk/README.md,
# adjusting relative paths accordingly.

set -e

echo "Syncing READMEs..."

# The root README is the source of truth.
SOURCE_README="README.md"
DEST_README="packages/toolprint-sdk/README.md"

if [ ! -f "$SOURCE_README" ]; then
    echo "Error: Root README.md not found!"
    exit 1
fi

# Use sed to perform replacements for the new path depth.
# We use | as a delimiter to avoid issues with paths containing /.
#
# 1. src="assets/         -> src="../../assets/
# 2. ](assets/            -> ](../../assets/
# 3. ](packages/toolprint-sdk/ -> ](
# 4. ](apps/              -> ](../../apps/
#
cat "$SOURCE_README" | \
  sed 's|src="assets/|src="../../assets/|g' | \
  sed 's|](assets/|](../../assets/|g' | \
  sed 's|](packages/toolprint-sdk/|](|g' | \
  sed 's|](apps/|](../../apps/|g' > "$DEST_README"

echo "✅ README sync complete." 