#!/usr/bin/env bash
###############################################################################
# fix_provider_constructor.sh – patches ethers provider calls for v5.x
###############################################################################
set -euo pipefail

FILE="./server/services/blockchain.ts"

[[ -f "$FILE" ]] || { echo "❌  $FILE not found – adjust the path then re-run."; exit 1; }

# Backup once (timestamped)
cp "$FILE" "${FILE}.bak.$(date +%s)"
echo "🗄️  Backup created: ${FILE}.bak.*"

# Patch JsonRpcProvider & WebSocketProvider
sed -i \
  -e 's/ethers\.JsonRpcProvider/ethers.providers.JsonRpcProvider/g' \
  -e 's/ethers\.WebSocketProvider/ethers.providers.WebSocketProvider/g' \
  "$FILE"

echo "✅  Replaced v6-style provider constructors with v5 syntax."
echo -e "🎉  Done – restart your Repl and the crash should be gone."