import { ethers } from 'ethers';

export class FlashLoanExecutor {
  constructor(contract, signer) {
    this.contract = contract;
    this.signer = signer;
  }

  async executeArbitrage(opportunity) {
    const { token, amount, buyExchange, sellExchange } = opportunity;

    const params = this.encodeArbitrageParams({
      tokenIn: token,
      tokenOut: 'USDC',
      dexA: buyExchange,
      dexB: sellExchange,
      fee: 3000,
      amountIn: amount
    });

    try {
      const tx = await this.contract.executeFlashLoan(
        token,
        amount,
        params,
        {
          gasLimit: 500000,
          gasPrice: await this.signer.provider.getGasPrice()
        }
      );
      console.log('Transaction submitted:', tx.hash);
      console.log('View on Etherscan:', `https://etherscan.io/tx/${tx.hash}`);
      const receipt = await tx.wait();
      console.log('Transaction confirmed in block:', receipt.blockNumber);
      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice.toString()
      };
    } catch (error) {
      console.error('Transaction failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  encodeArbitrageParams(params) {
    return ethers.utils.defaultAbiCoder.encode(
      ['address', 'address', 'address', 'address', 'uint24', 'uint256'],
      [params.tokenIn, params.tokenOut, params.dexA, params.dexB, params.fee, params.amountIn]
    );
  }
}
