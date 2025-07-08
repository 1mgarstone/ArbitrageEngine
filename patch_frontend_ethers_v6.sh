#!/usr/bin/env bash
###############################################################################
# patch_frontend_ethers_v6.sh – fixes Ethers v6 imports + constructors in Vite
###############################################################################
set -euo pipefail

FILES=$(grep -rl "ethers\.JsonRpcProvider" ./src || true)

if [[ -z "$FILES" ]]; then
  echo "✅  No frontend Ethers v6 constructor errors found."
  exit 0
fi

for FILE in $FILES; do
  cp "$FILE" "${FILE}.bak.$(date +%s)"
  echo "🛠️  Patching $FILE"

  # Replace the constructor
  sed -i 's/ethers\.JsonRpcProvider/JsonRpcProvider/g' "$FILE"

  # Fix the import line
  sed -i 's/import { ethers } from .ethers./import { JsonRpcProvider } from "ethers"/g' "$FILE"
done

echo -e "\n✅  All frontend uses of ethers.JsonRpcProvider() fixed for v6 compatibility."
echo "🔁  Restart your frontend: npm run dev"