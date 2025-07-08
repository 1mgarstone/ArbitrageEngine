import { ethers } from 'ethers';
import FlashLoanArbitrageABI from './FlashLoanArbitrage.json';

export class ContractDeployer {
  constructor(signer) {
    this.signer = signer;
  }

  async deployFlashLoanContract() {
    const factory = new ethers.ContractFactory(
      FlashLoanArbitrageABI.abi,
      FlashLoanArbitrageABI.bytecode,
      this.signer
    );
    console.log('Deploying contract...');
    const contract = await factory.deploy(
      '0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e',
      '0xE592427A0AEce92De3Edee1F18E0157C05861564'
    );
    await contract.deployed();
    console.log('Contract deployed to:', contract.address);

    return {
      address: contract.address,
      contract: contract,
      deploymentTx: contract.deployTransaction.hash
    };
  }
}
