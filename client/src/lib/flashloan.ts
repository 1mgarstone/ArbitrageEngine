import * as ethers from 'ethers';
import { FlashLoanProvider, FlashLoanConfig } from '../types/trading';

export class FlashLoanService {
  private providers: FlashLoanProvider[] = [
    {
      id: 'balancer',
      name: 'Balancer V2',
      fee: 0,
      maxLiquidity: '$1B+',
      supportedAssets: ['ETH', 'WETH', 'DAI', 'USDC', 'USDT', 'WBTC'],
      status: 'online'
    },
    {
      id: 'dydx',
      name: 'dYdX',
      fee: 0,
      maxLiquidity: '$500M+',
      supportedAssets: ['ETH', 'DAI', 'USDC'],
      status: 'online'
    },
    {
      id: 'aave',
      name: 'Aave V3',
      fee: 0.05,
      maxLiquidity: '$2B+',
      supportedAssets: ['ETH', 'WETH', 'DAI', 'USDC', 'USDT', 'WBTC', 'LINK', 'AAVE'],
      status: 'online'
    }
  ];

  getProviders(): FlashLoanProvider[] {
    return this.providers;
  }

  getProvider(id: string): FlashLoanProvider | undefined {
    return this.providers.find(p => p.id === id);
  }

  calculateFlashLoanAmount(balance: number, allocationPercentage: number = 80, leverageMultiplier: number = 1200): number {
    return (balance * allocationPercentage / 100) * leverageMultiplier;
  }

  calculateFee(amount: number, provider: 'balancer' | 'dydx' | 'aave'): number {
    const providerData = this.getProvider(provider);
    if (!providerData) return 0;
    
    return amount * (providerData.fee / 100);
  }

  getOptimalProvider(amount: number, asset: string): FlashLoanProvider {
    // Filter providers that support the asset
    const supportingProviders = this.providers.filter(p => 
      p.supportedAssets.includes(asset) && p.status === 'online'
    );

    if (supportingProviders.length === 0) {
      throw new Error(`No providers support asset: ${asset}`);
    }

    // Sort by fee (ascending) and return the cheapest
    return supportingProviders.sort((a, b) => a.fee - b.fee)[0];
  }

  async executeFlashLoan(
    config: FlashLoanConfig,
    targetContract: string,
    params: string,
    signer: ethers.Wallet
  ): Promise<ethers.ContractTransaction> {
    const provider = this.getProvider(config.provider);
    if (!provider) {
      throw new Error(`Provider ${config.provider} not found`);
    }

    switch (config.provider) {
      case 'balancer':
        return this.executeBalancerFlashLoan(config, targetContract, params, signer);
      case 'dydx':
        return this.executeDydxFlashLoan(config, targetContract, params, signer);
      case 'aave':
        return this.executeAaveFlashLoan(config, targetContract, params, signer);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  private async executeBalancerFlashLoan(
    config: FlashLoanConfig,
    targetContract: string,
    params: string,
    signer: ethers.Wallet
  ): Promise<ethers.ContractTransaction> {
    const vaultAddress = '0xBA12222222228d8Ba445958a75a0704d566BF2C8';
    const vaultABI = [
      'function flashLoan(address recipient, address[] tokens, uint256[] amounts, bytes userData)'
    ];

    const vault = new ethers.Contract(vaultAddress, vaultABI, signer);
    
    // For simplicity, using USDC as default token
    const tokens = ['0xA0b86a33E6417Aeb', '71']; // USDC address (placeholder)
    const amounts = [ethers.utils.parseUnits(config.amount.toString(), 6)]; // USDC has 6 decimals

    return await vault.flashLoan(targetContract, tokens, amounts, params);
  }

  private async executeDydxFlashLoan(
    config: FlashLoanConfig,
    targetContract: string,
    params: string,
    signer: ethers.Wallet
  ): Promise<ethers.ContractTransaction> {
    // dYdX flash loan implementation
    throw new Error('dYdX flash loan implementation pending');
  }

  private async executeAaveFlashLoan(
    config: FlashLoanConfig,
    targetContract: string,
    params: string,
    signer: ethers.Wallet
  ): Promise<ethers.ContractTransaction> {
    const poolAddress = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2';
    const poolABI = [
      'function flashLoanSimple(address receiverAddress, address asset, uint256 amount, bytes params, uint16 referralCode)'
    ];

    const pool = new ethers.Contract(poolAddress, poolABI, signer);
    
    // Using USDC as default asset
    const asset = '0xA0b86a33E6417Aeb'; // USDC address (placeholder)
    const amount = ethers.utils.parseUnits(config.amount.toString(), 6);

    return await pool.flashLoanSimple(targetContract, asset, amount, params, 0);
  }
}

export const flashLoanService = new FlashLoanService();
