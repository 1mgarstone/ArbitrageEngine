#!/usr/bin/env bash
###############################################################################
#  fix_wallet_connect.sh – One-shot patch for live wallet status + deployment #
###############################################################################
set -euo pipefail
echo "⏳  Initialising patch …"

########### 0. Dot-env harden / extend ########################################
if [[ ! -f .env ]]; then
  echo "❌  .env not found – create it first."
  exit 1
fi

# Add WALLET_PASSPHRASE stub if missing
grep -q "^WALLET_PASSPHRASE=" .env || echo "WALLET_PASSPHRASE=\"\"" >> .env

########### 1. Dependencies ####################################################
echo "📦  Installing dependencies …"
npm install --save ethers dotenv socket.io hardhat @nomiclabs/hardhat-ethers @nomiclabs/hardhat-etherscan >/dev/null

########### 2. Wallet connection helper #######################################
cat > walletConnection.js <<'EOF'
/**
 * walletConnection.js  – centralised provider/wallet util
 * Emits "wallet-status" every 3 s via exported function `watchStatus(io)`
 */
require('dotenv').config();
const { ethers } = require('ethers');

const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);

// ---- unlock wallet ---------------------------------------------------------
let signer;
if (process.env.MNEMONIC_PHRASE && process.env.MNEMONIC_PHRASE.trim() !== '') {
  signer = ethers.Wallet.fromMnemonic(
    process.env.MNEMONIC_PHRASE.replace(/"/g, '').trim(),
    process.env.WALLET_PASSPHRASE || ''
  ).connect(provider);
} else if (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.trim() !== '') {
  signer = new ethers.Wallet(process.env.PRIVATE_KEY.trim(), provider);
} else {
  throw new Error('No wallet credentials in .env');
}

// ---- utility helpers -------------------------------------------------------
async function isConnected () {
  try {
    await signer.getBalance();
    return true;
  } catch (_) {
    return false;
  }
}

function watchStatus (io) {
  setInterval(async () => {
    io.emit('wallet-status', await isConnected());
  }, 3000);
}

module.exports = { provider, signer, isConnected, watchStatus };
EOF
echo "✅  walletConnection.js written."

########### 3. Patch server.js for live status ################################
if ! grep -q "wallet-status" server.js 2>/dev/null; then
  echo "🔧  Injecting socket status emitter into server.js …"
  # 1) Require helper near top
  sed -i '1s;^;const { watchStatus } = require("./walletConnection");\n;' server.js
  # 2) Hook after socket.io initialisation (assumes variable `io`)
  sed -i '/io[^(].*listen\|new .*Server/ a watchStatus(io);' server.js
else
  echo "ℹ️  server.js already patched."
fi

########### 4. Deploy script ###################################################
mkdir -p scripts

cat > scripts/deploy.js <<'EOF'
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const { signer } = require('../walletConnection');

(async () => {
  console.log('🚀  Deploying FlashLoanReceiver …');

  const artifact = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../artifacts/FlashLoanReceiver.json'), 'utf8')
  );
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);

  const contract = await factory.deploy(
    process.env.AAVE_POOL_ADDRESS,
    process.env.UNISWAP_V3_ROUTER,
    process.env.SUSHISWAP_ROUTER
  );
  console.log('⏳  Awaiting confirmations …');
  await contract.deployTransaction.wait(5);

  console.log(`✅  Deployed at ${contract.address}`);
  // Overwrite or append CONTRACT_ADDRESS in .env
  const env = fs.readFileSync('.env', 'utf8');
  const updated = env.replace(/^CONTRACT_ADDRESS=.*/m, `CONTRACT_ADDRESS=${contract.address}`);
  fs.writeFileSync('.env', updated.includes('CONTRACT_ADDRESS=') ? updated : env + `\nCONTRACT_ADDRESS=${contract.address}\n`);
})();
EOF
chmod +x scripts/deploy.js
echo "✅  scripts/deploy.js ready."

########### 5. Arbitrage trigger ##############################################
cat > scripts/arbitrage.js <<'EOF'
require('dotenv').config();
const { ethers } = require('ethers');
const { signer } = require('../walletConnection');

const ABI = [
  'function executeFlashLoan(uint256 amount) external'
];

(async () => {
  if (!process.env.CONTRACT_ADDRESS) {
    throw new Error('CONTRACT_ADDRESS missing – deploy first.');
  }

  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, signer);
  const balance = await signer.getBalance();
  const amount = balance.mul(80).div(100); // 80 %
  console.log(`💸  Flash-loaning ${ethers.utils.formatEther(amount)} ETH …`);

  const tx = await contract.executeFlashLoan(amount, { gasLimit: 1_500_000 });
  await tx.wait();
  console.log('🎉  Arbitrage tx confirmed:', tx.hash);
})();
EOF
chmod +x scripts/arbitrage.js
echo "✅  scripts/arbitrage.js ready."

########### 6. Finished #######################################################
echo -e "\n🎉  Patch complete.\n"
echo "👉  NEXT STEPS"
echo "   1.  node scripts/deploy.js     # one-time contract deployment"
echo "   2.  node scripts/arbitrage.js  # run each arbitrage attempt"
echo "   3.  Restart the Repl – your dashboard light will turn 🔵/🟢 automatically.\n"