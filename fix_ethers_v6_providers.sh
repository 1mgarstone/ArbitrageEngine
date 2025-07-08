#!/usr/bin/env bash
###############################################################################
# fix_ethers_v6_providers.sh
# Converts ethers v6-style provider constructors to v5 across the whole project
###############################################################################
set -euo pipefail

echo "🔍  Searching for v6 provider calls …"

# Extensions to scan
EXTENSIONS="ts tsx js jsx"

# Patterns to replace  (v6 → v5)
declare -A REPLACEMENTS=(
  ["ethers.JsonRpcProvider"]="ethers.providers.JsonRpcProvider"
  ["ethers.WebSocketProvider"]="ethers.providers.WebSocketProvider"
  ["ethers.StaticJsonRpcProvider"]="ethers.providers.StaticJsonRpcProvider"
)

# Find matching files
FILES=$(grep -irl --include="*.{$(echo $EXTENSIONS | sed 's/ /,/g')}" \
        -e "ethers\.JsonRpcProvider(" \
        -e "ethers\.WebSocketProvider(" \
        -e "ethers\.StaticJsonRpcProvider(" . || true)

if [[ -z "$FILES" ]]; then
  echo "✅  No v6 provider constructors found. Nothing to patch."
  exit 0
fi

echo "📝  Files to patch:"
echo "$FILES"

for FILE in $FILES; do
  # Backup once per file
  cp "$FILE" "${FILE}.bak.$(date +%s)"
  echo "🗄️   Backup created: ${FILE}.bak.*"

  # Apply all replacements
  for V6 in "${!REPLACEMENTS[@]}"; do
    V5=${REPLACEMENTS[$V6]}
    sed -i "s/${V6}/${V5}/g" "$FILE"
  done

  echo "✅  Patched $FILE"
done

echo -e "\n🎉  All provider constructors converted to ethers v5 syntax."
echo "🔁  Restart your app (npm run dev) and the JsonRpcProvider crash should be gone."