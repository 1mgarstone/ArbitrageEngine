import { useState, useEffect } from 'react';
import { WalletInfo, NetworkStatus } from '../types/trading';
import { blockchainService } from '../lib/blockchain';

export function useWallet() {
  const [wallet, setWallet] = useState<WalletInfo>({
    address: '',
    balance: 0,
    isConnected: false,
    network: 'ethereum'
  });

  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    ethereum: {
      connected: false,
      gasPrice: 0,
      blockNumber: 0
    },
    polygon: {
      connected: false,
      gasPrice: 0,
      blockNumber: 0
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const privateKey = import.meta.env.VITE_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('Private key not found in environment variables');
      }

      const signer = await blockchainService.connectWallet(privateKey);
      const balance = await blockchainService.getBalance(signer.address);

      setWallet({
        address: signer.address,
        balance,
        isConnected: true,
        network: 'ethereum'
      });

      // Update network status
      const gasPrice = await blockchainService.getGasPrice();
      const blockNumber = await blockchainService.getBlockNumber();

      setNetworkStatus(prev => ({
        ...prev,
        ethereum: {
          connected: true,
          gasPrice,
          blockNumber
        }
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      console.error('Wallet connection error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBalance = async () => {
    if (!wallet.isConnected || !wallet.address) return;

    try {
      const balance = await blockchainService.getBalance(wallet.address);
      setWallet(prev => ({ ...prev, balance }));
    } catch (err) {
      console.error('Error refreshing balance:', err);
    }
  };

  const updateNetworkStatus = async () => {
    try {
      const gasPrice = await blockchainService.getGasPrice();
      const blockNumber = await blockchainService.getBlockNumber();

      setNetworkStatus(prev => ({
        ...prev,
        ethereum: {
          ...prev.ethereum,
          gasPrice,
          blockNumber
        }
      }));
    } catch (err) {
      console.error('Error updating network status:', err);
    }
  };

  useEffect(() => {
    // Auto-connect if private key is available
    const privateKey = import.meta.env.VITE_PRIVATE_KEY;
    if (privateKey && !wallet.isConnected) {
      connectWallet();
    }
  }, []);

  useEffect(() => {
    // Set up periodic balance and network status updates
    if (wallet.isConnected) {
      const interval = setInterval(() => {
        refreshBalance();
        updateNetworkStatus();
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [wallet.isConnected]);

  return {
    wallet,
    networkStatus,
    isLoading,
    error,
    connectWallet,
    refreshBalance,
    updateNetworkStatus
  };
}
