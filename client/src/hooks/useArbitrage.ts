import { useState, useEffect, useCallback } from 'react';
import { ArbitrageOpportunity, Transaction, TradingStats } from '../types/trading';
import { arbitrageService } from '../lib/arbitrage';
import { useFlashLoan } from './useFlashLoan';

export function useArbitrage() {
  const { executeFlashLoan } = useFlashLoan();
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TradingStats>({
    totalProfit: 0,
    dailyPnL: 0,
    successRate: 0,
    successfulTrades: 0,
    totalTrades: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    winRate: 0
  });

  const [isScanning, setIsScanning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [autoExecute, setAutoExecute] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanOpportunities = useCallback(async () => {
    setIsScanning(true);
    setError(null);

    try {
      const newOpportunities = await arbitrageService.scanOpportunities();
      setOpportunities(newOpportunities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan opportunities');
    } finally {
      setIsScanning(false);
    }
  }, []);

  const executeArbitrage = async (opportunityId: string): Promise<boolean> => {
    setIsExecuting(true);
    setError(null);

    try {
      const opportunity = opportunities.find(op => op.id === opportunityId);
      if (!opportunity) {
        throw new Error('Opportunity not found');
      }

      // Execute arbitrage through flash loan
      const result = await arbitrageService.executeArbitrage(opportunityId);

      if (result.success && result.txHash) {
        // Add transaction to history
        const newTransaction: Transaction = {
          hash: result.txHash,
          tokenPair: opportunity.tokenPair,
          type: 'arbitrage',
          profit: opportunity.afterFeesProfit,
          status: 'pending',
          timestamp: Date.now(),
          etherscanUrl: `https://etherscan.io/tx/${result.txHash}`
        };

        setTransactions(prev => [newTransaction, ...prev]);

        // Update stats
        setStats(prev => ({
          ...prev,
          totalTrades: prev.totalTrades + 1,
          successfulTrades: prev.successfulTrades + 1,
          totalProfit: prev.totalProfit + opportunity.afterFeesProfit,
          dailyPnL: prev.dailyPnL + opportunity.afterFeesProfit,
          successRate: ((prev.successfulTrades + 1) / (prev.totalTrades + 1)) * 100,
          winRate: ((prev.successfulTrades + 1) / (prev.totalTrades + 1)) * 100
        }));

        return true;
      } else {
        throw new Error(result.error || 'Execution failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Arbitrage execution failed');
      
      // Add failed transaction
      const failedTransaction: Transaction = {
        hash: '',
        tokenPair: opportunities.find(op => op.id === opportunityId)?.tokenPair || 'Unknown',
        type: 'arbitrage',
        profit: -15.20, // Estimated gas cost
        status: 'failed',
        timestamp: Date.now(),
        etherscanUrl: '',
        reason: err instanceof Error ? err.message : 'Unknown error'
      };

      setTransactions(prev => [failedTransaction, ...prev]);
      
      setStats(prev => ({
        ...prev,
        totalTrades: prev.totalTrades + 1,
        totalProfit: prev.totalProfit - 15.20, // Gas cost
        dailyPnL: prev.dailyPnL - 15.20,
        successRate: (prev.successfulTrades / (prev.totalTrades + 1)) * 100,
        winRate: (prev.successfulTrades / (prev.totalTrades + 1)) * 100
      }));

      return false;
    } finally {
      setIsExecuting(false);
    }
  };

  const refreshOpportunities = useCallback(() => {
    scanOpportunities();
  }, [scanOpportunities]);

  const toggleAutoExecute = (enabled: boolean) => {
    setAutoExecute(enabled);
  };

  // Start real-time scanning when component mounts
  useEffect(() => {
    arbitrageService.startRealTimeScanning(5000, (newOpportunities) => {
      setOpportunities(newOpportunities);
    });

    // Initial scan
    scanOpportunities();

    return () => {
      arbitrageService.stopRealTimeScanning();
    };
  }, [scanOpportunities]);

  // Auto-execute profitable opportunities
  useEffect(() => {
    if (autoExecute && opportunities.length > 0 && !isExecuting) {
      const profitableOps = arbitrageService.filterProfitableOpportunities(opportunities, 50);
      const sortedOps = arbitrageService.sortByProfitability(profitableOps);
      
      if (sortedOps.length > 0) {
        executeArbitrage(sortedOps[0].id);
      }
    }
  }, [autoExecute, opportunities, isExecuting]);

  // Load transaction history and stats from API
  useEffect(() => {
    const loadHistoricalData = async () => {
      try {
        const response = await fetch('/api/arbitrage/history');
        if (response.ok) {
          const data = await response.json();
          setTransactions(data.transactions || []);
          setStats(data.stats || stats);
        }
      } catch (err) {
        console.error('Error loading historical data:', err);
      }
    };

    loadHistoricalData();
  }, []);

  return {
    opportunities,
    transactions,
    stats,
    isScanning,
    isExecuting,
    autoExecute,
    error,
    scanOpportunities: refreshOpportunities,
    executeArbitrage,
    toggleAutoExecute
  };
}
