import { ethers } from 'ethers';

export class BlockchainProvider {
  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(
      process.env.REACT_APP_ETHEREUM_RPC_URL
    );
    this.signer = null;
  }

  async connectWallet(privateKey) {
    this.signer = new ethers.Wallet(privateKey, this.provider);
    return this.signer;
  }

  async getBalance(address) {
    return await this.provider.getBalance(address);
  }

  async getGasPrice() {
    return await this.provider.getGasPrice();
  }
}
