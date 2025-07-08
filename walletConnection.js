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
