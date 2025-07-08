import * as ethers from 'ethers';

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private polygonProvider: ethers.JsonRpcProvider;

  constructor() {
    const ethRpcUrl = process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/your-project-id';
    const polygonRpcUrl = process.env.POLYGON_RPC_URL || 'https://polygon-mainnet.infura.io/v3/your-project-id';
    
    this.provider = new ethers.JsonRpcProvider(ethRpcUrl);
    this.polygonProvider = new ethers.JsonRpcProvider(polygonRpcUrl);
  }

  async getEthereumGasPrice(): Promise<number> {
    try {
      const gasPrice = await this.provider.getGasPrice();
      return parseFloat(ethers.utils.formatUnits(gasPrice, 'gwei'));
    } catch (error) {
      console.error('Error getting Ethereum gas price:', error);
      return 20; // fallback
    }
  }

  async getPolygonGasPrice(): Promise<number> {
    try {
      const gasPrice = await this.polygonProvider.getGasPrice();
      return parseFloat(ethers.utils.formatUnits(gasPrice, 'gwei'));
    } catch (error) {
      console.error('Error getting Polygon gas price:', error);
      return 30; // fallback
    }
  }

  async getEthereumBlockNumber(): Promise<number> {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      console.error('Error getting Ethereum block number:', error);
      return 0;
    }
  }

  async getPolygonBlockNumber(): Promise<number> {
    try {
      return await this.polygonProvider.getBlockNumber();
    } catch (error) {
      console.error('Error getting Polygon block number:', error);
      return 0;
    }
  }

  async getTokenPrice(tokenAddress: string, exchange: string): Promise<number> {
    // Implementation would depend on specific DEX APIs
    // For now, return mock prices for demo
    const mockPrices: Record<string, number> = {
      'ETH': 2000,
      'USDC': 1,
      'USDT': 1,
      'DAI': 1,
      'WETH': 2000,
      'WBTC': 40000
    };

    return mockPrices[tokenAddress] || Math.random() * 100;
  }

  async estimateGasCost(transaction: any): Promise<number> {
    try {
      const gasLimit = await this.provider.estimateGas(transaction);
      const gasPrice = await this.provider.getGasPrice();
      const gasCost = gasLimit.mul(gasPrice);
      return parseFloat(ethers.utils.formatEther(gasCost));
    } catch (error) {
      console.error('Error estimating gas cost:', error);
      return 0.01; // fallback estimate
    }
  }

  async monitorTransaction(txHash: string): Promise<{
    status: 'success' | 'failed' | 'pending';
    blockNumber?: number;
    gasUsed?: string;
  }> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (receipt) {
        return {
          status: receipt.status === 1 ? 'success' : 'failed',
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        };
      }
      return { status: 'pending' };
    } catch (error) {
      console.error('Error monitoring transaction:', error);
      return { status: 'failed' };
    }
  }
}

export const blockchainService = new BlockchainService();
