import { useState, useEffect } from 'react';
import { FlashLoanProvider, FlashLoanConfig } from '../types/trading';
import { flashLoanService } from '../lib/flashloan';
import { useWallet } from './useWallet';

export function useFlashLoan() {
  const { wallet } = useWallet();
  const [providers, setProviders] = useState<FlashLoanProvider[]>([]);
  const [config, setConfig] = useState<FlashLoanConfig>({
    provider: 'balancer',
    amount: 0,
    fee: 0,
    availableCapital: 0,
    leverageMultiplier: 1200
  });

  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load flash loan providers
    const loadedProviders = flashLoanService.getProviders();
    setProviders(loadedProviders);
  }, []);

  useEffect(() => {
    // Update flash loan configuration when wallet balance changes
    if (wallet.balance > 0) {
      const allocationPercentage = 80; // 80% of balance
      const flashLoanAmount = flashLoanService.calculateFlashLoanAmount(
        wallet.balance,
        allocationPercentage,
        config.leverageMultiplier
      );

      const selectedProvider = flashLoanService.getProvider(config.provider);
      const fee = selectedProvider ? flashLoanService.calculateFee(flashLoanAmount, config.provider) : 0;

      setConfig(prev => ({
        ...prev,
        amount: flashLoanAmount,
        fee,
        availableCapital: flashLoanAmount
      }));
    }
  }, [wallet.balance, config.provider, config.leverageMultiplier]);

  const updateProvider = (providerId: 'balancer' | 'dydx' | 'aave') => {
    setConfig(prev => ({ ...prev, provider: providerId }));
  };

  const updateLeverageMultiplier = (multiplier: number) => {
    setConfig(prev => ({ ...prev, leverageMultiplier: multiplier }));
  };

  const executeFlashLoan = async (
    targetContract: string,
    params: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!wallet.isConnected) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsExecuting(true);
    setError(null);

    try {
      const signer = flashLoanService.getSigner();
      const tx = await flashLoanService.executeFlashLoan(
        config,
        targetContract,
        params,
        signer
      );

      return {
        success: true,
        txHash: tx.hash
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Flash loan execution failed';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsExecuting(false);
    }
  };

  const getOptimalProvider = (asset: string): FlashLoanProvider | null => {
    try {
      return flashLoanService.getOptimalProvider(config.amount, asset);
    } catch (err) {
      console.error('Error getting optimal provider:', err);
      return null;
    }
  };

  return {
    providers,
    config,
    isExecuting,
    error,
    updateProvider,
    updateLeverageMultiplier,
    executeFlashLoan,
    getOptimalProvider
  };
}
