import dotenv from 'dotenv';
dotenv.config();

import { RealTradingEngine } from '../trading/realTradingEngine.js';

async function setupRealTrading() {
  console.log('Setting up REAL trading system...');

  const engine = new RealTradingEngine();

  const privateKey = process.env.REACT_APP_PRIVATE_KEY;

  if (!privateKey || privateKey.length < 10) {
    console.error('Private key is missing or invalid in .env');
    process.exit(1);
  }

  const result = await engine.initialize(privateKey);

  if (result.success) {
    console.log('✅ Real trading system ready!');
    console.log('Wallet:', result.walletAddress);
    console.log('Contract:', result.contractAddress);
    console.log('Deployment TX:', result.deploymentTx);
    console.log('Etherscan:', `https://etherscan.io/tx/${result.deploymentTx}`);
  } else {
    console.error('❌ Setup failed:', result.error);
  }
}

setupRealTrading();
