import { ethers } from 'ethers';

export class BalancerFlashLoan {
  constructor(signer) {
    this.signer = signer;
    this.vaultAddress = '0xBA12222222228d8Ba445958a75a0704d566BF2C8';
    this.vaultABI = [
      'function flashLoan(address recipient, address[] tokens, uint256[] amounts, bytes userData)',
      'function getPoolTokens(bytes32 poolId) view returns (address[] tokens, uint256[] balances, uint256 lastChangeBlock)'
    ];
    this.vault = new ethers.Contract(this.vaultAddress, this.vaultABI, signer);
  }

  async executeFlashLoan(recipient, tokens, amounts, userData) {
    try {
      const tx = await this.vault.flashLoan(
        recipient,
        tokens,
        amounts,
        userData
      );
      console.log('Balancer flash loan transaction:', tx.hash);
      return tx;
    } catch (error) {
      console.error('Balancer flash loan failed:', error);
      throw error;
    }
  }
}
