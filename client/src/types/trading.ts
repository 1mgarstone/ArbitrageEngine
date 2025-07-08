export interface ArbitrageOpportunity {
  id: string;
  tokenPair: string;
  buyExchange: string;
  sellExchange: string;
  priceDiff: number;
  estimatedProfit: number;
  afterFeesProfit: number;
  volume: 'High' | 'Medium' | 'Low';
  gasEstimate: number;
  flashLoanProvider: 'balancer' | 'dydx' | 'aave';
  lastUpdated: number;
}

export interface FlashLoanProvider {
  id: 'balancer' | 'dydx' | 'aave';
  name: string;
  fee: number;
  maxLiquidity: string;
  supportedAssets: string[];
  status: 'online' | 'offline';
}

export interface Transaction {
  hash: string;
  tokenPair: string;
  type: 'arbitrage' | 'flash_loan';
  profit: number;
  status: 'success' | 'failed' | 'pending';
  timestamp: number;
  gasUsed?: number;
  etherscanUrl: string;
  reason?: string;
}

export interface WalletInfo {
  address: string;
  balance: number;
  isConnected: boolean;
  network: string;
}

export interface TradingStats {
  totalProfit: number;
  dailyPnL: number;
  successRate: number;
  successfulTrades: number;
  totalTrades: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
}

export interface RiskSettings {
  maxPositionSize: number;
  dailyLossLimit: number;
  maxConcurrentTrades: number;
  minProfitThreshold: number;
  maxGasPrice: number;
  slippageTolerance: number;
  mevProtection: boolean;
  lossAlerts: boolean;
  autoPause: boolean;
  autoExecute: boolean;
}

export interface FlashLoanConfig {
  provider: 'balancer' | 'dydx' | 'aave';
  amount: number;
  fee: number;
  availableCapital: number;
  leverageMultiplier: number;
}

export interface NetworkStatus {
  ethereum: {
    connected: boolean;
    gasPrice: number;
    blockNumber: number;
  };
  polygon: {
    connected: boolean;
    gasPrice: number;
    blockNumber: number;
  };
}
