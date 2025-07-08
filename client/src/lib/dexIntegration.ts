import * as ethers from 'ethers';

export interface DexRoute {
  exchange: string;
  path: string[];
  amountIn: string;
  amountOut: string;
  gasEstimate: number;
  priceImpact: number;
}

export interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOutMin: string;
  deadline: number;
  recipient: string;
}

export class DexIntegration {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet | null = null;

  // Contract addresses
  private readonly contracts = {
    uniswapV2Router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    uniswapV3Router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    sushiswapRouter: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
    balancerVault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    curveRegistry: '0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5'
  };

  // ABIs
  private readonly abis = {
    uniswapV2Router: [
      'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
      'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
    ],
    uniswapV3Router: [
      'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)'
    ],
    balancerVault: [
      'function queryBatchSwap(uint8 kind, (bytes32 poolId, uint256 assetInIndex, uint256 assetOutIndex, uint256 amount, bytes userData)[] swaps, address[] assets, (address sender, bool fromInternalBalance, address recipient, bool toInternalBalance) funds) external returns (int256[] memory)'
    ]
  };

  constructor() {
    const rpcUrl = import.meta.env.VITE_ETHEREUM_RPC_URL;
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  setSigner(signer: ethers.Wallet) {
    this.signer = signer;
  }

  async getUniswapV2Quote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<DexRoute | null> {
    try {
      const router = new ethers.Contract(
        this.contracts.uniswapV2Router,
        this.abis.uniswapV2Router,
        this.provider
      );

      const path = [tokenIn, tokenOut];
      const amounts = await router.getAmountsOut(amountIn, path);

      return {
        exchange: 'Uniswap V2',
        path,
        amountIn,
        amountOut: amounts[amounts.length - 1].toString(),
        gasEstimate: 150000,
        priceImpact: this.calculatePriceImpact(amountIn, amounts[amounts.length - 1].toString())
      };
    } catch (error) {
      console.error('Error getting Uniswap V2 quote:', error);
      return null;
    }
  }

  async getUniswapV3Quote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    fee: number = 3000
  ): Promise<DexRoute | null> {
    try {
      // For V3, we'd need to use the Quoter contract
      // This is a simplified implementation
      return {
        exchange: 'Uniswap V3',
        path: [tokenIn, tokenOut],
        amountIn,
        amountOut: amountIn, // Placeholder - would use actual quoter
        gasEstimate: 120000,
        priceImpact: 0.1
      };
    } catch (error) {
      console.error('Error getting Uniswap V3 quote:', error);
      return null;
    }
  }

  async getSushiSwapQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<DexRoute | null> {
    try {
      const router = new ethers.Contract(
        this.contracts.sushiswapRouter,
        this.abis.uniswapV2Router, // Same ABI as Uniswap V2
        this.provider
      );

      const path = [tokenIn, tokenOut];
      const amounts = await router.getAmountsOut(amountIn, path);

      return {
        exchange: 'SushiSwap',
        path,
        amountIn,
        amountOut: amounts[amounts.length - 1].toString(),
        gasEstimate: 160000,
        priceImpact: this.calculatePriceImpact(amountIn, amounts[amounts.length - 1].toString())
      };
    } catch (error) {
      console.error('Error getting SushiSwap quote:', error);
      return null;
    }
  }

  async getBalancerQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<DexRoute | null> {
    try {
      // Balancer implementation would be more complex
      // This is a placeholder
      return {
        exchange: 'Balancer',
        path: [tokenIn, tokenOut],
        amountIn,
        amountOut: amountIn,
        gasEstimate: 200000,
        priceImpact: 0.05
      };
    } catch (error) {
      console.error('Error getting Balancer quote:', error);
      return null;
    }
  }

  async getAllQuotes(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<DexRoute[]> {
    const quotes = await Promise.allSettled([
      this.getUniswapV2Quote(tokenIn, tokenOut, amountIn),
      this.getUniswapV3Quote(tokenIn, tokenOut, amountIn),
      this.getSushiSwapQuote(tokenIn, tokenOut, amountIn),
      this.getBalancerQuote(tokenIn, tokenOut, amountIn)
    ]);

    return quotes
      .filter((result): result is PromiseFulfilledResult<DexRoute> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
  }

  async executeSwap(
    exchange: string,
    params: SwapParams
  ): Promise<ethers.ContractTransaction> {
    if (!this.signer) {
      throw new Error('Signer not set');
    }

    switch (exchange) {
      case 'Uniswap V2':
        return this.executeUniswapV2Swap(params);
      case 'Uniswap V3':
        return this.executeUniswapV3Swap(params);
      case 'SushiSwap':
        return this.executeSushiSwapSwap(params);
      default:
        throw new Error(`Unsupported exchange: ${exchange}`);
    }
  }

  private async executeUniswapV2Swap(params: SwapParams): Promise<ethers.ContractTransaction> {
    const router = new ethers.Contract(
      this.contracts.uniswapV2Router,
      this.abis.uniswapV2Router,
      this.signer!
    );

    const path = [params.tokenIn, params.tokenOut];
    
    return await router.swapExactTokensForTokens(
      params.amountIn,
      params.amountOutMin,
      path,
      params.recipient,
      params.deadline
    );
  }

  private async executeUniswapV3Swap(params: SwapParams): Promise<ethers.ContractTransaction> {
    const router = new ethers.Contract(
      this.contracts.uniswapV3Router,
      this.abis.uniswapV3Router,
      this.signer!
    );

    const swapParams = {
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      fee: 3000, // 0.3%
      recipient: params.recipient,
      deadline: params.deadline,
      amountIn: params.amountIn,
      amountOutMinimum: params.amountOutMin,
      sqrtPriceLimitX96: 0
    };

    return await router.exactInputSingle(swapParams);
  }

  private async executeSushiSwapSwap(params: SwapParams): Promise<ethers.ContractTransaction> {
    const router = new ethers.Contract(
      this.contracts.sushiswapRouter,
      this.abis.uniswapV2Router,
      this.signer!
    );

    const path = [params.tokenIn, params.tokenOut];
    
    return await router.swapExactTokensForTokens(
      params.amountIn,
      params.amountOutMin,
      path,
      params.recipient,
      params.deadline
    );
  }

  private calculatePriceImpact(amountIn: string, amountOut: string): number {
    // Simplified price impact calculation
    // In reality, this would require more complex calculations
    const impact = (parseFloat(amountIn) / parseFloat(amountOut) - 1) * 100;
    return Math.abs(impact);
  }

  async findBestRoute(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<DexRoute | null> {
    const routes = await this.getAllQuotes(tokenIn, tokenOut, amountIn);
    
    if (routes.length === 0) return null;

    // Sort by output amount (descending) and select best
    return routes.sort((a, b) => 
      parseFloat(b.amountOut) - parseFloat(a.amountOut)
    )[0];
  }

  async estimateGas(
    exchange: string,
    params: SwapParams
  ): Promise<number> {
    if (!this.signer) {
      throw new Error('Signer not set');
    }

    try {
      let router: ethers.Contract;
      let methodCall: any;

      switch (exchange) {
        case 'Uniswap V2':
        case 'SushiSwap':
          router = new ethers.Contract(
            exchange === 'Uniswap V2' ? this.contracts.uniswapV2Router : this.contracts.sushiswapRouter,
            this.abis.uniswapV2Router,
            this.signer
          );
          methodCall = router.populateTransaction.swapExactTokensForTokens(
            params.amountIn,
            params.amountOutMin,
            [params.tokenIn, params.tokenOut],
            params.recipient,
            params.deadline
          );
          break;

        case 'Uniswap V3':
          router = new ethers.Contract(
            this.contracts.uniswapV3Router,
            this.abis.uniswapV3Router,
            this.signer
          );
          methodCall = router.populateTransaction.exactInputSingle({
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            fee: 3000,
            recipient: params.recipient,
            deadline: params.deadline,
            amountIn: params.amountIn,
            amountOutMinimum: params.amountOutMin,
            sqrtPriceLimitX96: 0
          });
          break;

        default:
          throw new Error(`Unsupported exchange: ${exchange}`);
      }

      const populatedTx = await methodCall;
      const gasEstimate = await this.provider.estimateGas(populatedTx);
      return gasEstimate.toNumber();

    } catch (error) {
      console.error(`Error estimating gas for ${exchange}:`, error);
      // Return fallback estimates
      const fallbackGas = {
        'Uniswap V2': 150000,
        'Uniswap V3': 120000,
        'SushiSwap': 160000,
        'Balancer': 200000
      };
      return fallbackGas[exchange as keyof typeof fallbackGas] || 150000;
    }
  }
}

export const dexIntegration = new DexIntegration();
