import { ArbitrageOpportunity } from '../types/trading';

export class ArbitrageService {
  private opportunities: ArbitrageOpportunity[] = [];
  private updateInterval: number | null = null;

  async scanOpportunities(): Promise<ArbitrageOpportunity[]> {
    try {
      const response = await fetch('/api/arbitrage/scan');
      if (!response.ok) {
        throw new Error('Failed to fetch opportunities');
      }
      
      const data = await response.json();
      this.opportunities = data.opportunities || [];
      return this.opportunities;
    } catch (error) {
      console.error('Error scanning opportunities:', error);
      return [];
    }
  }

  async executeArbitrage(opportunityId: string): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    try {
      const response = await fetch('/api/arbitrage/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ opportunityId }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute arbitrage');
      }

      return await response.json();
    } catch (error) {
      console.error('Error executing arbitrage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  startRealTimeScanning(intervalMs: number = 5000, callback?: (opportunities: ArbitrageOpportunity[]) => void) {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = window.setInterval(async () => {
      const opportunities = await this.scanOpportunities();
      if (callback) {
        callback(opportunities);
      }
    }, intervalMs);
  }

  stopRealTimeScanning() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  getOpportunities(): ArbitrageOpportunity[] {
    return this.opportunities;
  }

  calculatePotentialProfit(
    amount: number,
    priceDiff: number,
    flashLoanFee: number = 0,
    gasEstimate: number = 0.01 // ETH
  ): number {
    const grossProfit = amount * (priceDiff / 100);
    const flashLoanCost = amount * (flashLoanFee / 100);
    const gasCost = gasEstimate * 2000; // Rough ETH to USD conversion
    
    return grossProfit - flashLoanCost - gasCost;
  }

  filterProfitableOpportunities(
    opportunities: ArbitrageOpportunity[],
    minProfitThreshold: number = 50 // USD
  ): ArbitrageOpportunity[] {
    return opportunities.filter(op => op.afterFeesProfit >= minProfitThreshold);
  }

  sortByProfitability(opportunities: ArbitrageOpportunity[]): ArbitrageOpportunity[] {
    return [...opportunities].sort((a, b) => b.afterFeesProfit - a.afterFeesProfit);
  }
}

export const arbitrageService = new ArbitrageService();
