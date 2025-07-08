#!/bin/bash

set -e

echo "Creating full React app setup, system check script, and updating package.json..."

# Create React directories
mkdir -p src public

# 1) package.json with React scripts and check script
cat > package.json << 'EOF'
{
  "name": "flashloan-arbitrage",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node scripts/setupRealTrading.js",
    "dev": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "check": "node scripts/checkSystem.js"
  },
  "dependencies": {
    "ethers": "^6.0.0",
    "dotenv": "^16.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-scripts": "^5.0.1"
  }
}
EOF

# 2) React entry src/index.jsx
cat > src/index.jsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RealTradingDashboard } from '../components/RealTradingDashboard.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<RealTradingDashboard />);
EOF

# 3) public/index.html
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Real Flash Loan Arbitrage Trading</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>
EOF

# 4) scripts/checkSystem.js
mkdir -p scripts
cat > scripts/checkSystem.js << 'EOF'
import { exec } from 'child_process';
import { BlockchainProvider } from '../providers/blockchain.js';
import { RealTradingEngine } from '../trading/realTradingEngine.js';
import dotenv from 'dotenv';

dotenv.config();

async function check() {
  console.log('Starting system check...\n');

  if (!process.env.REACT_APP_PRIVATE_KEY || !process.env.REACT_APP_ETHEREUM_RPC_URL) {
    console.error('Error: Missing essential .env variables!');
    process.exit(1);
  }
  console.log('✅ .env variables exist.');

  exec('node -v', (err, stdout) => {
    if (err) { console.error('Node is not installed or not found'); }
    else console.log(`✅ Node version: ${stdout.trim()}`);
  });

  exec('npm -v', (err, stdout) => {
    if (err) { console.error('npm is not installed or not found'); }
    else console.log(`✅ npm version: ${stdout.trim()}`);
  });

  const blockchain = new BlockchainProvider();
  try {
    const blockNumber = await blockchain.provider.getBlockNumber();
    console.log(`✅ Connected to Ethereum node. Current block number: ${blockNumber}`);
  } catch (e) {
    console.error('❌ Unable to connect to Ethereum node:', e.message);
    process.exit(1);
  }

  const engine = new RealTradingEngine();
  try {
    const result = await engine.initialize(process.env.REACT_APP_PRIVATE_KEY);
    if (result.success) {
      console.log('✅ RealTradingEngine initialized, wallet:', result.walletAddress);
      console.log('Contract deployed at:', result.contractAddress);
    } else {
      console.error('❌ RealTradingEngine initialization failed:', result.error);
      process.exit(1);
    }
  } catch(e) {
    console.error('❌ RealTradingEngine threw error:', e.message);
    process.exit(1);
  }

  try {
    const { RealTradingDashboard } = await import('../components/RealTradingDashboard.jsx');
    if (typeof RealTradingDashboard === 'function') {
      console.log('✅ React component RealTradingDashboard is importable and valid.');
    }
  } catch (e) {
    console.error('❌ Error importing React components:', e.message);
    process.exit(1);
  }

  console.log('\n✅ SYSTEM CHECK COMPLETE: Everything looks good!');
  process.exit(0);
}

check();
EOF

echo "Installing npm dependencies..."
npm install

echo ""
echo "===================================================="
echo "🎉 Full React app setup with system check script created."
echo ""
echo "➡️ Next steps for Replit Agent or you to finish the project:"
echo " 1) Replace the placeholder ABI and bytecode in contracts/FlashLoanArbitrage.json with your real compiled contract data."
echo " 2) Confirm all sensitive keys and URLs are correctly set in your .env file."
echo " 3) Deploy your smart contract and initialize the engine running:"
echo "      npm start"
echo " 4) Update your .env REACT_APP_CONTRACT_ADDRESS with the deployed contract address."
echo " 5) Run your React frontend development server using:"
echo "      npm run dev"
echo " 6) Run the full system check anytime with:"
echo "      npm run check"
echo ""
echo "⚠️ Remember: NEVER commit your .env file or private keys to source control!"
echo "===================================================="
