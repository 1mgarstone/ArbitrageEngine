import { formatEther, formatUnits } from 'ethers';
import * as ethers from 'ethers';

export class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Wallet | null = null;

  constructor() {
    this.initializeProvider();
  }

  private initializeProvider() {
    const rpcUrl = import.meta.env.VITE_ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/your-project-id';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  async connectWallet(privateKey: string): Promise<ethers.Wallet> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    
    this.signer = new ethers.Wallet(privateKey, this.provider);
    return this.signer;
  }

  async getBalance(address: string): Promise<number> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    const balance = await this.provider.getBalance(address);
    return parseFloat(formatEther(balance));
  }

  /**
   * Advanced auto-gas handler: fetches gas price from multiple sources and chooses the best value.
   * Falls back to provider's value if oracles are unavailable.
   */
  async getOptimalGasPrice(): Promise<number> {
    let prices: number[] = [];
    // 1. Try eth_gasPrice from provider
    try {
      if (this.provider) {
        const feeData = await this.provider.getFeeData();
        if (feeData.gasPrice) prices.push(parseFloat(formatUnits(feeData.gasPrice, 'gwei')));
      }
    } catch (e) { /* ignore */ }
    // 2. Try public gas oracles (e.g., ethgasstation, blocknative, etherscan)
    try {
      const res = await fetch('https://ethgasstation.info/api/ethgasAPI.json');
      if (res.ok) {
        const data = await res.json();
        // ethgasstation returns gas price in tenths of gwei
        if (data.fast) prices.push(data.fast / 10);
        if (data.safeLow) prices.push(data.safeLow / 10);
      }
    } catch (e) { /* ignore */ }
    try {
      const res = await fetch('https://api.blocknative.com/gasprices/blockprices', {
        headers: { 'Authorization': 'BLOCKNATIVE_API_KEY' } // Replace with your key
      });
      if (res.ok) {
        const data = await res.json();
        if (data.blockPrices && data.blockPrices[0]?.estimatedPrices) {
          prices.push(data.blockPrices[0].estimatedPrices[0].price);
        }
      }
    } catch (e) { /* ignore */ }
    // 3. Choose the lowest non-zero price, fallback to 30 gwei
    const filtered = prices.filter(p => p > 0);
    if (filtered.length === 0) return 30; // fallback
    return Math.min(...filtered);
  }

  async getBlockNumber(): Promise<number> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    
    return await this.provider.getBlockNumber();
  }

  async getTransactionReceipt(txHash: string) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    
    return await this.provider.getTransactionReceipt(txHash);
  }

  setExternalSigner(signer: any) {
    this.signer = signer;
  }

  getSigner(): ethers.Wallet {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }
    return this.signer;
  }

  getProvider(): ethers.JsonRpcProvider {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    return this.provider;
  }

  // Multicall support for batch reads
  async multicall(calls: Array<{ to: string, data: string }>): Promise<any[]> {
    if (!this.provider) throw new Error('Provider not initialized');
    // This is a placeholder. For production, use a deployed Multicall contract address.
    // Consider using https://github.com/makerdao/multicall for mainnet.
    throw new Error('Multicall not implemented. Integrate a Multicall contract for batch reads.');
  }

  // Flashbots/private mempool integration (future):
  // Consider using Flashbots for private transaction submission to avoid front-running.

  // Upgradable contract pattern (future):
  // If you plan to upgrade contracts, use OpenZeppelin Proxy pattern and admin controls.

  // Error logging (Sentry or similar):
  // Integrate Sentry or another error tracking service for production monitoring.
}

export const blockchainService = new BlockchainService();
