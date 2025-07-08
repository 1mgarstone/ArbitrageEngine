import { ethers } from 'ethers';

export class AaveFlashLoan {
  constructor(signer) {
    this.signer = signer;
    this.poolAddress = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2';
    this.poolABI = [
      'function flashLoanSimple(address receiverAddress, address asset, uint256 amount, bytes params, uint16 referralCode)',
      'function getReserveData(address asset) view returns (tuple(uint256 configuration, uint128 liquidityIndex, uint128 currentLiquidityRate, uint128 variableBorrowIndex, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, uint16 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt))'
    ];
    this.pool = new ethers.Contract(this.poolAddress, this.poolABI, signer);
  }

  async executeFlashLoan(receiverAddress, asset, amount, params) {
    try {
      const tx = await this.pool.flashLoanSimple(
        receiverAddress,
        asset,
        amount,
        params,
        0
      );
      console.log('Aave flash loan transaction:', tx.hash);
      return tx;
    } catch (error) {
      console.error('Aave flash loan failed:', error);
      throw error;
    }
  }

  async getAvailableLiquidity(asset) {
    const reserveData = await this.pool.getReserveData(asset);
    return reserveData;
  }
}
