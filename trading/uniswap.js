import { ethers } from 'ethers';

export class UniswapTrader {
  constructor(signer) {
    this.signer = signer;
    this.routerAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
    this.routerABI = [
      'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) returns (uint256 amountOut)'
    ];
    this.router = new ethers.Contract(this.routerAddress, this.routerABI, signer);
  }

  async executeTrade(tokenIn, tokenOut, amountIn, fee = 3000) {
    const params = {
      tokenIn: tokenIn,
      tokenOut: tokenOut,
      fee: fee,
      recipient: this.signer.address,
      deadline: Math.floor(Date.now() / 1000) + 60 * 20,
      amountIn: amountIn,
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0
    };
    try {
      const tx = await this.router.exactInputSingle(params);
      console.log('Uniswap trade transaction:', tx.hash);
      return tx;
    } catch (error) {
      console.error('Uniswap trade failed:', error);
      throw error;
    }
  }
}
