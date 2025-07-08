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
