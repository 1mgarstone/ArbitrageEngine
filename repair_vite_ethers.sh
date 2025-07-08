#!/usr/bin/env bash
###############################################################################
# repair_vite_ethers.sh – fix provider constructors + add Node polyfills to Vite
###############################################################################
set -euo pipefail

echo "📦  Installing polyfills …"
npm install --save-dev vite-plugin-node-polyfills buffer process

################################################################################
# 1) Patch vite.config.(js|ts|mjs|cjs) to inject the polyfill plugin
################################################################################
CFG=$(ls vite.config.{js,mjs,ts,cjs} 2>/dev/null | head -n1 || true)
if [[ -z "$CFG" ]]; then
  echo "❌  vite.config.* not found. Abort."
  exit 1
fi

echo "🔧  Patching $CFG …"
cp "$CFG" "${CFG}.bak.$(date +%s)"

# If plugin already present, skip; else inject.
if ! grep -q "vite-plugin-node-polyfills" "$CFG"; then
  # 1. add import statement (after first import)
  sed -i '0,/import/s//$&\nimport nodePolyfills from "vite-plugin-node-polyfills";/' "$CFG"
  # 2. add plugin to the array inside defineConfig
  sed -i '0,/plugins: \[/s//plugins: [nodePolyfills(), /' "$CFG"
  echo "✅  Polyfill plugin injected."
else
  echo "ℹ️  Polyfill plugin already present."
fi

################################################################################
# 2) Replace v6-style provider calls in every frontend source file
################################################################################
echo "🔍  Scanning src/ and client/ for provider constructors …"

PATTERN='ethers\.\(JsonRpcProvider\|WebSocketProvider\|StaticJsonRpcProvider\)('
FILES=$(grep -Irl --exclude-dir=node_modules -E "$PATTERN" ./src ./client 2>/dev/null || true)

if [[ -z "$FILES" ]]; then
  echo "✅  No outdated provider calls found."
else
  echo "📝  Patching:"
  echo "$FILES"
  for F in $FILES; do
    cp "$F" "${F}.bak.$(date +%s)"
    sed -i \
      -e 's/ethers\.JsonRpcProvider/ethers.providers.JsonRpcProvider/g' \
      -e 's/ethers\.WebSocketProvider/ethers.providers.WebSocketProvider/g' \
      -e 's/ethers\.StaticJsonRpcProvider/ethers.providers.StaticJsonRpcProvider/g' \
      "$F"
    echo "✔️   $F"
  done
fi

echo -e "\n🎉  Frontend fixed. Restart Vite:\n\n   npm run dev\n"