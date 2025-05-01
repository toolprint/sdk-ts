#!/bin/bash

CLIENT_DIR="./packages/onegrep-api-client/src"

# Find files containing the pattern and handle spaces in filenames
find $CLIENT_DIR -type f -name "*.ts" -print0 | xargs -0 grep -l "z.discriminatedUnion('client_type', \[" | while IFS= read -r file; do
  echo "Processing: $file"
  # Use double quotes around variables to preserve spaces
  sed -i '' "s/z.discriminatedUnion('client_type', \\[/z.union([/g" "$file"
done

echo "Replacement complete."