import axios from 'axios';
import * as ethers from 'ethers';

export interface TokenPrice {
  exchange: string;
  price: number;
  liquidity: number;
  timestamp: number;
}

export interface PriceQuote {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  exchange: string;
  gasEstimate: number;
  priceImpact: number;
}

export class DexService {
  private readonly exchanges = {
    uniswapV2: {
      name: 'Uniswap V2',
      router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
      subgraphUrl: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2'
    },
    uniswapV3: {
      name: 'Uniswap V3',
      router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      subgraphUrl: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3'
    },
    sushiswap: {
      name: 'SushiSwap',
      router: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
      factory: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
      subgraphUrl: 'https://api.thegraph.com/subgraphs/name/sushiswap/exchange'
    },
    curve: {
      name: 'Curve',
      registry: '0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5',
      subgraphUrl: 'https://api.thegraph.com/subgraphs/name/curvefi/curve'
    },
    balancer: {
      name: 'Balancer',
      vault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      subgraphUrl: 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2'
    }
  };

  private provider: ethers.JsonRpcProvider;
  private oneInchApiKey: string;
  private coinGeckoApiKey: string;

  constructor() {
    const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/your-project-id';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.oneInchApiKey = process.env.ONEINCH_API_KEY || '';
    this.coinGeckoApiKey = process.env.COINGECKO_API_KEY || '';
  }

  async getTokenPricesAcrossExchanges(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<TokenPrice[]> {
    const prices: TokenPrice[] = [];

    try {
      // Get prices from multiple exchanges in parallel
      const [
        uniV2Price,
        uniV3Price,
        sushiPrice,
        balancerPrice,
        oneInchPrice
      ] = await Promise.allSettled([
        this.getUniswapV2Price(tokenIn, tokenOut, amountIn),
        this.getUniswapV3Price(tokenIn, tokenOut, amountIn),
        this.getSushiSwapPrice(tokenIn, tokenOut, amountIn),
        this.getBalancerPrice(tokenIn, tokenOut, amountIn),
        this.get1inchPrice(tokenIn, tokenOut, amountIn)
      ]);

      // Process results
      if (uniV2Price.status === 'fulfilled' && uniV2Price.value) {
        prices.push(uniV2Price.value);
      }
      if (uniV3Price.status === 'fulfilled' && uniV3Price.value) {
        prices.push(uniV3Price.value);
      }
      if (sushiPrice.status === 'fulfilled' && sushiPrice.value) {
        prices.push(sushiPrice.value);
      }
      if (balancerPrice.status === 'fulfilled' && balancerPrice.value) {
        prices.push(balancerPrice.value);
      }
      if (oneInchPrice.status === 'fulfilled' && oneInchPrice.value) {
        prices.push(oneInchPrice.value);
      }

    } catch (error) {
      console.error('Error getting token prices:', error);
    }

    return prices.filter(price => price.price > 0);
  }

  private async getUniswapV2Price(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<TokenPrice | null> {
    try {
      const query = `
        {
          pairs(where: {
            token0: "${tokenIn.toLowerCase()}"
            token1: "${tokenOut.toLowerCase()}"
          }) {
            token0Price
            token1Price
            reserveUSD
            volumeUSD
          }
        }
      `;

      const response = await axios.post(this.exchanges.uniswapV2.subgraphUrl, {
        query
      });

      if (response.data?.data?.pairs?.length > 0) {
        const pair = response.data.data.pairs[0];
        return {
          exchange: 'Uniswap V2',
          price: parseFloat(pair.token0Price),
          liquidity: parseFloat(pair.reserveUSD),
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error('Error getting Uniswap V2 price:', error);
    }
    return null;
  }

  private async getUniswapV3Price(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<TokenPrice | null> {
    try {
      const query = `
        {
          pools(where: {
            token0: "${tokenIn.toLowerCase()}"
            token1: "${tokenOut.toLowerCase()}"
          }, orderBy: totalValueLockedUSD, orderDirection: desc, first: 1) {
            token0Price
            token1Price
            totalValueLockedUSD
            volumeUSD
          }
        }
      `;

      const response = await axios.post(this.exchanges.uniswapV3.subgraphUrl, {
        query
      });

      if (response.data?.data?.pools?.length > 0) {
        const pool = response.data.data.pools[0];
        return {
          exchange: 'Uniswap V3',
          price: parseFloat(pool.token0Price),
          liquidity: parseFloat(pool.totalValueLockedUSD),
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error('Error getting Uniswap V3 price:', error);
    }
    return null;
  }

  private async getSushiSwapPrice(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<TokenPrice | null> {
    try {
      const query = `
        {
          pairs(where: {
            token0: "${tokenIn.toLowerCase()}"
            token1: "${tokenOut.toLowerCase()}"
          }) {
            token0Price
            token1Price
            reserveUSD
            volumeUSD
          }
        }
      `;

      const response = await axios.post(this.exchanges.sushiswap.subgraphUrl, {
        query
      });

      if (response.data?.data?.pairs?.length > 0) {
        const pair = response.data.data.pairs[0];
        return {
          exchange: 'SushiSwap',
          price: parseFloat(pair.token0Price),
          liquidity: parseFloat(pair.reserveUSD),
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error('Error getting SushiSwap price:', error);
    }
    return null;
  }

  private async getBalancerPrice(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<TokenPrice | null> {
    try {
      const query = `
        {
          pools(where: {
            tokensList_contains: ["${tokenIn.toLowerCase()}", "${tokenOut.toLowerCase()}"]
          }, orderBy: totalLiquidity, orderDirection: desc, first: 1) {
            totalLiquidity
            totalSwapVolume
            tokens {
              address
              balance
              weight
            }
          }
        }
      `;

      const response = await axios.post(this.exchanges.balancer.subgraphUrl, {
        query
      });

      if (response.data?.data?.pools?.length > 0) {
        const pool = response.data.data.pools[0];
        const tokenInData = pool.tokens.find((t: any) => t.address.toLowerCase() === tokenIn.toLowerCase());
        const tokenOutData = pool.tokens.find((t: any) => t.address.toLowerCase() === tokenOut.toLowerCase());

        if (tokenInData && tokenOutData) {
          const price = (parseFloat(tokenOutData.balance) / parseFloat(tokenInData.balance)) *
                       (parseFloat(tokenInData.weight) / parseFloat(tokenOutData.weight));

          return {
            exchange: 'Balancer',
            price,
            liquidity: parseFloat(pool.totalLiquidity),
            timestamp: Date.now()
          };
        }
      }
    } catch (error) {
      console.error('Error getting Balancer price:', error);
    }
    return null;
  }

  private async get1inchPrice(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<TokenPrice | null> {
    if (!this.oneInchApiKey) return null;

    try {
      const response = await axios.get(
        `https://api.1inch.dev/swap/v5.2/1/quote`,
        {
          params: {
            src: tokenIn,
            dst: tokenOut,
            amount: amountIn
          },
          headers: {
            'Authorization': `Bearer ${this.oneInchApiKey}`
          }
        }
      );

      if (response.data) {
        const price = parseFloat(response.data.toAmount) / parseFloat(amountIn);
        return {
          exchange: '1inch',
          price,
          liquidity: 0, // 1inch doesn't provide liquidity data
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error('Error getting 1inch price:', error);
    }
    return null;
  }

  async findArbitrageOpportunities(
    tokenPairs: string[],
    minProfitThreshold: number = 0.1
  ): Promise<any[]> {
    const opportunities = [];

    for (const pair of tokenPairs) {
      const [tokenIn, tokenOut] = pair.split('/');
      const amountIn = ethers.parseEther('1').toString(); // 1 ETH equivalent

      try {
        const prices = await this.getTokenPricesAcrossExchanges(tokenIn, tokenOut, amountIn);
        
        if (prices.length < 2) continue;

        // Sort by price
        const sortedPrices = prices.sort((a, b) => a.price - b.price);
        const cheapest = sortedPrices[0];
        const expensive = sortedPrices[sortedPrices.length - 1];

        const priceDiff = ((expensive.price - cheapest.price) / cheapest.price) * 100;

        if (priceDiff > minProfitThreshold) {
          const estimatedProfit = this.calculateEstimatedProfit(priceDiff, 100000); // $100k flash loan
          const flashLoanProvider = this.selectOptimalFlashLoanProvider(estimatedProfit);
          
          opportunities.push({
            id: `${pair}-${cheapest.exchange}-${expensive.exchange}-${Date.now()}`,
            tokenPair: pair,
            buyExchange: cheapest.exchange,
            sellExchange: expensive.exchange,
            priceDiff,
            estimatedProfit: estimatedProfit.gross,
            afterFeesProfit: estimatedProfit.net,
            volume: this.categorizeVolume(estimatedProfit.net),
            gasEstimate: 0.01,
            flashLoanProvider,
            buyPrice: cheapest.price,
            sellPrice: expensive.price,
            buyLiquidity: cheapest.liquidity,
            sellLiquidity: expensive.liquidity,
            lastUpdated: Date.now(),
            isActive: true,
            createdAt: new Date()
          });
        }
      } catch (error) {
        console.error(`Error processing pair ${pair}:`, error);
      }
    }

    return opportunities.sort((a, b) => b.afterFeesProfit - a.afterFeesProfit);
  }

  private calculateEstimatedProfit(priceDiff: number, flashLoanAmount: number) {
    const grossProfit = flashLoanAmount * (priceDiff / 100);
    const flashLoanFee = flashLoanAmount * 0.0005; // Assume worst case (Aave 0.05%)
    const gasCost = 25; // Estimated gas cost in USD
    const slippageCost = grossProfit * 0.005; // 0.5% slippage
    
    const netProfit = grossProfit - flashLoanFee - gasCost - slippageCost;

    return {
      gross: grossProfit,
      net: Math.max(0, netProfit),
      fees: flashLoanFee + gasCost + slippageCost
    };
  }

  private selectOptimalFlashLoanProvider(profit: any): 'balancer' | 'dydx' | 'aave' {
    // Always prefer zero-fee providers
    if (profit.gross > 1000) return 'balancer'; // High liquidity for large amounts
    if (profit.gross > 100) return 'dydx'; // Good for medium amounts
    return 'aave'; // Fallback
  }

  private categorizeVolume(profit: number): 'High' | 'Medium' | 'Low' {
    if (profit > 200) return 'High';
    if (profit > 100) return 'Medium';
    return 'Low';
  }

  async getTokenInfo(address: string) {
    try {
      const tokenContract = new ethers.Contract(
        address,
        ['function name() view returns (string)', 'function symbol() view returns (string)', 'function decimals() view returns (uint8)'],
        this.provider
      );

      const [name, symbol, decimals] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals()
      ]);

      return { name, symbol, decimals, address };
    } catch (error) {
      console.error(`Error getting token info for ${address}:`, error);
      return null;
    }
  }

  async getLiquidity(exchange: string, tokenA: string, tokenB: string): Promise<number> {
    // Implementation would depend on specific exchange
    // Return estimated liquidity in USD
    return Math.random() * 1000000; // Placeholder
  }
}

export const dexService = new DexService();
