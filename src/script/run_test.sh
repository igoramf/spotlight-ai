#!/bin/bash

# Check if a filename is provided as an argument
if [ -z "$1" ]; then
  echo "Usage: $0 <test_file_name>"
  exit 1
fi

# Compile TypeScript
npx tsc --project tsconfig.test.json

# Copy non-TS assets to the output directory
cp src/services/openai/prompt_base.txt dist-test/

# Run the test
node "dist-test/$1.js"
