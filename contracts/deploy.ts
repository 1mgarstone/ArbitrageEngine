import * as ethers from 'ethers';
import FlashLoanArbitrageABI from './FlashLoanArbitrage.json';

export interface DeploymentResult {
  address: string;
  contract: ethers.Contract;
  deploymentTx: string;
  gasUsed: string;
  deploymentCost: string;
}

export class ContractDeployer {
  private signer: ethers.Wallet;
  private provider: ethers.JsonRpcProvider;

  constructor(signer: ethers.Wallet) {
    this.signer = signer;
    this.provider = signer.provider as ethers.JsonRpcProvider;
  }

  async deployFlashLoanArbitrageContract(): Promise<DeploymentResult> {
    try {
      console.log('🚀 Starting FlashLoanArbitrage contract deployment...');
      console.log('📝 Deployer address:', this.signer.address);
      
      // Check deployer balance
      const balance = await this.signer.getBalance();
      console.log('💰 Deployer balance:', ethers.utils.formatEther(balance), 'ETH');
      
      if (balance.lt(ethers.utils.parseEther('0.1'))) {
        throw new Error('Insufficient balance for deployment. Need at least 0.1 ETH');
      }

      // Create contract factory
      const factory = new ethers.ContractFactory(
        FlashLoanArbitrageABI.abi,
        FlashLoanArbitrageABI.bytecode,
        this.signer
      );

      // Estimate gas for deployment
      const deploymentData = factory.getDeployTransaction();
      const gasEstimate = await this.provider.estimateGas(deploymentData);
      const gasPrice = await this.provider.getGasPrice();
      const deploymentCost = gasEstimate.mul(gasPrice);
      
      console.log('⛽ Estimated gas:', gasEstimate.toString());
      console.log('💸 Estimated cost:', ethers.utils.formatEther(deploymentCost), 'ETH');

      // Deploy contract
      console.log('📤 Deploying contract...');
      const contract = await factory.deploy({
        gasLimit: gasEstimate.mul(120).div(100), // Add 20% buffer
        gasPrice: gasPrice
      });

      console.log('⏳ Waiting for deployment transaction...');
      console.log('🔗 Transaction hash:', contract.deployTransaction.hash);
      
      // Wait for deployment
      const receipt = await contract.deployTransaction.wait();
      
      console.log('✅ Contract deployed successfully!');
      console.log('📍 Contract address:', contract.address);
      console.log('🧾 Block number:', receipt.blockNumber);
      console.log('⛽ Gas used:', receipt.gasUsed.toString());
      console.log('🔗 Etherscan:', `https://etherscan.io/address/${contract.address}`);

      // Verify contract is deployed correctly
      const code = await this.provider.getCode(contract.address);
      if (code === '0x') {
        throw new Error('Contract deployment failed - no code at address');
      }

      return {
        address: contract.address,
        contract: contract,
        deploymentTx: contract.deployTransaction.hash,
        gasUsed: receipt.gasUsed.toString(),
        deploymentCost: ethers.utils.formatEther(receipt.gasUsed.mul(receipt.effectiveGasPrice))
      };

    } catch (error) {
      console.error('❌ Contract deployment failed:', error);
      throw error;
    }
  }

  async verifyContractOnEtherscan(
    contractAddress: string,
    constructorArgs: any[] = []
  ): Promise<void> {
    const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
    if (!etherscanApiKey) {
      console.warn('⚠️  ETHERSCAN_API_KEY not provided, skipping verification');
      return;
    }

    try {
      console.log('🔍 Verifying contract on Etherscan...');
      
      // Implementation would use etherscan API
      // For now, just log the verification URL
      console.log('🔗 Manual verification URL:', 
        `https://etherscan.io/verifyContract?a=${contractAddress}`);
      
    } catch (error) {
      console.error('❌ Contract verification failed:', error);
    }
  }

  async getDeploymentInfo(contractAddress: string) {
    const contract = new ethers.Contract(
      contractAddress,
      FlashLoanArbitrageABI.abi,
      this.signer
    );

    const [owner, balance] = await Promise.all([
      contract.owner(),
      this.provider.getBalance(contractAddress)
    ]);

    return {
      address: contractAddress,
      owner,
      balance: ethers.utils.formatEther(balance),
      isVerified: false // Would check etherscan API
    };
  }
}

// Deployment script
export async function deployContract() {
  const privateKey = process.env.PRIVATE_KEY || process.env.VITE_PRIVATE_KEY;
  const rpcUrl = process.env.ETHEREUM_RPC_URL || process.env.VITE_ETHEREUM_RPC_URL;

  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  if (!rpcUrl) {
    throw new Error('ETHEREUM_RPC_URL environment variable is required');
  }

  // Create provider and signer
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  // Deploy contract
  const deployer = new ContractDeployer(signer);
  const deployment = await deployer.deployFlashLoanArbitrageContract();

  // Optionally verify on Etherscan
  await deployer.verifyContractOnEtherscan(deployment.address);

  return deployment;
}

// If running directly
if (require.main === module) {
  deployContract()
    .then((deployment) => {
      console.log('\n🎉 Deployment completed successfully!');
      console.log('📋 Summary:');
      console.log('  Address:', deployment.address);
      console.log('  TX Hash:', deployment.deploymentTx);
      console.log('  Gas Used:', deployment.gasUsed);
      console.log('  Cost:', deployment.deploymentCost, 'ETH');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Deployment failed:', error.message);
      process.exit(1);
    });
}
