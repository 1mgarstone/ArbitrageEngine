import { ethers } from 'ethers';

export class TransactionMonitor {
  constructor(provider) {
    this.provider = provider;
    this.activeTransactions = new Map();
  }

  async monitorTransaction(txHash) {
    console.log(`Monitoring transaction: ${txHash}`);

    return new Promise((resolve, reject) => {
      const checkTransaction = async () => {
        try {
          const receipt = await this.provider.getTransactionReceipt(txHash);
          if (receipt) {
            const result = {
              txHash: txHash,
              blockNumber: receipt.blockNumber,
              status: receipt.status,
              gasUsed: receipt.gasUsed.toString(),
              etherscanUrl: `https://etherscan.io/tx/${txHash}`
            };
            console.log('Transaction confirmed:', result);
            resolve(result);
          } else {
            setTimeout(checkTransaction, 3000);
          }
        } catch (error) {
          reject(error);
        }
      };

      checkTransaction();
    });
  }

  async getTransactionDetails(txHash) {
    const tx = await this.provider.getTransaction(txHash);
    const receipt = await this.provider.getTransactionReceipt(txHash);

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: ethers.utils.formatEther(tx.value),
      gasPrice: ethers.utils.formatUnits(tx.gasPrice, 'gwei'),
      gasLimit: tx.gasLimit.toString(),
      gasUsed: receipt ? receipt.gasUsed.toString() : 'Pending',
      status: receipt ? (receipt.status === 1 ? 'Success' : 'Failed') : 'Pending',
      blockNumber: receipt ? receipt.blockNumber : 'Pending'
    };
  }
}
