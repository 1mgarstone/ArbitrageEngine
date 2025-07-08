import { ethers } from 'ethers';
import { BlockchainProvider } from '../providers/blockchain.js';
import { ContractDeployer } from '../contracts/deploy.js';
import { FlashLoanExecutor } from './flashLoanExecutor.js';
import { TransactionMonitor } from '../monitoring/transactionMonitor.js';
import { AaveFlashLoan } from '../integrations/aave.js';
import { BalancerFlashLoan } from '../integrations/balancer.js';

export class RealTradingEngine {
  constructor() {
    this.blockchain = new BlockchainProvider();
    this.monitor = null;
    this.contract = null;
    this.executor = null;
    this.isConnected = false;
  }

  async initialize(privateKey) {
    try {
      const signer = await this.blockchain.connectWallet(privateKey);
      console.log('Wallet connected:', signer.address);

      this.monitor = new TransactionMonitor(this.blockchain.provider);

      const deployer = new ContractDeployer(signer);
      const deployment = await deployer.deployFlashLoanContract();

      this.contract = deployment.contract;
      console.log('Contract ready at:', deployment.address);

      this.executor = new FlashLoanExecutor(this.contract, signer);

      this.isConnected = true;

      return {
        success: true,
        walletAddress: signer.address,
        contractAddress: deployment.address,
        deploymentTx: deployment.deploymentTx
      };
    } catch (error) {
      console.error('Initialization failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async executeRealArbitrage(opportunity) {
    if (!this.isConnected) {
      throw new Error('Trading engine not initialized');
    }

    console.log('Executing REAL arbitrage on blockchain...');

    const balance = await this.getWalletBalance();
    const flashLoanAmount = this.calculateFlashLoanAmount(balance);

    const result = await this.executor.executeArbitrage({
      ...opportunity,
      amount: flashLoanAmount
    });

    if (result.success) {
      const txDetails = await this.monitor.monitorTransaction(result.txHash);

      const newBalance = await this.getWalletBalance();

      return {
        success: true,
        txHash: result.txHash,
        etherscanUrl: `https://etherscan.io/tx/${result.txHash}`,
        oldBalance: balance,
        newBalance: newBalance,
        profit: newBalance - balance,
        blockNumber: txDetails.blockNumber
      };
    } else {
      return result;
    }
  }

  async getWalletBalance() {
    const balance = await this.blockchain.getBalance(
      this.blockchain.signer.address
    );
    return parseFloat(ethers.utils.formatEther(balance));
  }

  calculateFlashLoanAmount(balance) {
    const percentage = 0.8;
    const leverageMultiplier = 1200;
    return balance * percentage * leverageMultiplier;
  }

  async getRealTransactionHistory() {
    const address = this.blockchain.signer.address;
    const latestBlock = await this.blockchain.provider.getBlockNumber();

    const history = [];
    for (let i = 0; i < 100; i++) {
      const block = await this.blockchain.provider.getBlockWithTransactions(
        latestBlock - i
      );

      const userTxs = block.transactions.filter(
        tx => tx.from === address || tx.to === address
      );

      history.push(...userTxs);
    }
    return history;
  }
}
