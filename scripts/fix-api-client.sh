#!/bin/bash

CLIENT_DIR="./packages/toolprint-api-client/src"

# Add the following to the end of the file (I'm not sure why these wouldn't be exported by default)
echo "export * from './client.gen.js'" >> $CLIENT_DIR/index.ts
echo "export * from './schemas.gen.js'" >> $CLIENT_DIR/index.ts
echo "export * from './zod.gen.js'" >> $CLIENT_DIR/index.ts

echo "Fix complete."