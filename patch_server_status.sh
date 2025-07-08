#!/usr/bin/env bash
###############################################################################
# patch_server_status.sh – injects live wallet-status support into server.js  #
###############################################################################
set -euo pipefail

FILE="server.js"
[[ -f $FILE ]] || { echo "❌  $FILE not found – run from repo root."; exit 1; }

# 1) Back-up once (timestamped)
cp "$FILE" "${FILE}.bak.$(date +%s)"
echo "🗄️  Backup saved to ${FILE}.bak.*"

# 2) Add the require line at the very top (only if missing)
if ! grep -q "watchStatus" "$FILE"; then
  sed -i '1s#^#const { watchStatus } = require("./walletConnection");\n#' "$FILE"
  echo "✅  Added require('./walletConnection') at top of $FILE"
else
  echo "ℹ️  Require already present – skipped."
fi

# 3) Add the watchStatus(io) call right after the first socket-io/server init
if ! grep -q "watchStatus(io)" "$FILE"; then
  # First choice: a line with “new Server”
  if grep -q "new \+Server" "$FILE"; then
    sed -i '0,/new \+Server.*/s//&\nwatchStatus(io);/' "$FILE"
  else
    # Fallback: a line that calls socket.io directly
    sed -i '0,/socket\.io.*(/s//&\nwatchStatus(io);/' "$FILE"
  fi
  echo "✅  Injected watchStatus(io); after io initialisation."
else
  echo "ℹ️  watchStatus(io) call already present – skipped."
fi

echo "🎉  server.js patched successfully."