import React, { useState } from 'react';
import { 
  Zap, 
  TrendingUp, 
  Search, 
  Activity, 
  Shield, 
  Settings, 
  Wallet, 
  BarChart3, 
  History, 
  ArrowUp, 
  AlertTriangle, 
  Play,
  StopCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useWallet } from '@/hooks/useWallet';
import { useFlashLoan } from '@/hooks/useFlashLoan';
import { useArbitrage } from '@/hooks/useArbitrage';

export function TradingDashboard() {
  const { wallet, networkStatus, connectWallet, isLoading: walletLoading } = useWallet();
  const { config: flashLoanConfig, providers, updateProvider } = useFlashLoan();
  const { 
    opportunities, 
    transactions, 
    stats, 
    isScanning, 
    isExecuting, 
    autoExecute, 
    scanOpportunities, 
    executeArbitrage, 
    toggleAutoExecute 
  } = useArbitrage();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [riskSettings, setRiskSettings] = useState({
    maxPositionSize: 80,
    dailyLossLimit: 2,
    maxConcurrentTrades: 5,
    minProfitThreshold: 0.10,
    maxGasPrice: 50,
    slippageTolerance: 0.5,
    mevProtection: true,
    lossAlerts: true,
    autoPause: true
  });

  const handleExecuteArbitrage = async (opportunityId: string) => {
    await executeArbitrage(opportunityId);
  };

  const handleEmergencyStop = () => {
    toggleAutoExecute(false);
    alert('Emergency stop activated! All trading operations paused.');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-trading-dark text-white">
      {/* Top Navigation */}
      <nav className="bg-trading-card border-b border-trading-border px-6 py-3 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Zap className="text-profit text-xl" />
              <h1 className="text-xl font-bold">FlashArb Pro</h1>
            </div>
            <div className="hidden md:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${networkStatus.ethereum.connected ? 'bg-profit animate-pulse-profit' : 'bg-gray-500'}`} />
                <span className="text-gray-300">Ethereum {networkStatus.ethereum.connected ? 'Connected' : 'Disconnected'}</span>
              </div>
              <div className="text-gray-400">|</div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${networkStatus.polygon.connected ? 'bg-profit animate-pulse-profit' : 'bg-gray-500'}`} />
                <span className="text-gray-300">Polygon {networkStatus.polygon.connected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="hidden sm:flex items-center space-x-4 bg-trading-dark px-4 py-2 rounded-lg border border-trading-border">
              <div className="text-center">
                <div className="text-xs text-gray-400">Portfolio Balance</div>
                <div className="text-lg font-semibold text-profit">{formatCurrency(wallet.balance)}</div>
              </div>
              <div className="w-px h-8 bg-trading-border"></div>
              <div className="text-center">
                <div className="text-xs text-gray-400">Today's P&L</div>
                <div className={`text-lg font-semibold ${stats.dailyPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {stats.dailyPnL >= 0 ? '+' : ''}{formatCurrency(stats.dailyPnL)}
                </div>
              </div>
            </div>
            
            <Button 
              onClick={connectWallet} 
              disabled={walletLoading}
              className="bg-profit hover:bg-profit/80"
            >
              <Wallet className="mr-2 h-4 w-4" />
              {wallet.isConnected ? formatAddress(wallet.address) : 'Connect Wallet'}
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="w-64 bg-trading-card border-r border-trading-border h-screen fixed left-0 top-16 overflow-y-auto">
          <div className="p-4 space-y-2">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center space-x-3 px-3 py-2 w-full text-left rounded-lg transition-colors ${
                  activeTab === 'dashboard' ? 'bg-profit bg-opacity-10 text-profit' : 'text-gray-300 hover:bg-trading-border'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('scanner')}
                className={`flex items-center space-x-3 px-3 py-2 w-full text-left rounded-lg transition-colors ${
                  activeTab === 'scanner' ? 'bg-profit bg-opacity-10 text-profit' : 'text-gray-300 hover:bg-trading-border'
                }`}
              >
                <Search className="w-5 h-5" />
                <span>Arbitrage Scanner</span>
              </button>
              <button
                onClick={() => setActiveTab('flashloans')}
                className={`flex items-center space-x-3 px-3 py-2 w-full text-left rounded-lg transition-colors ${
                  activeTab === 'flashloans' ? 'bg-profit bg-opacity-10 text-profit' : 'text-gray-300 hover:bg-trading-border'
                }`}
              >
                <Zap className="w-5 h-5" />
                <span>Flash Loans</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center space-x-3 px-3 py-2 w-full text-left rounded-lg transition-colors ${
                  activeTab === 'history' ? 'bg-profit bg-opacity-10 text-profit' : 'text-gray-300 hover:bg-trading-border'
                }`}
              >
                <History className="w-5 h-5" />
                <span>Transaction History</span>
              </button>
              <button
                onClick={() => setActiveTab('risk')}
                className={`flex items-center space-x-3 px-3 py-2 w-full text-left rounded-lg transition-colors ${
                  activeTab === 'risk' ? 'bg-profit bg-opacity-10 text-profit' : 'text-gray-300 hover:bg-trading-border'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span>Risk Management</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center space-x-3 px-3 py-2 w-full text-left rounded-lg transition-colors ${
                  activeTab === 'settings' ? 'bg-profit bg-opacity-10 text-profit' : 'text-gray-300 hover:bg-trading-border'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
            </nav>
          </div>
          
          {/* Flash Loan Provider Status */}
          <div className="p-4 mt-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Flash Loan Providers</h3>
            <div className="space-y-2">
              {providers.map(provider => (
                <div key={provider.id} className="flex items-center justify-between p-2 bg-trading-dark rounded">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${provider.status === 'online' ? 'bg-profit' : 'bg-gray-500'}`} />
                    <span className="text-sm">{provider.name}</span>
                  </div>
                  <span className={`text-xs ${provider.fee === 0 ? 'text-profit' : 'text-warning'}`}>
                    {provider.fee}% Fee
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-6 space-y-6">
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-trading-card border-trading-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Available Leverage</p>
                        <p className="text-2xl font-bold text-profit">{flashLoanConfig.leverageMultiplier}x</p>
                        <p className="text-xs text-gray-500 mt-1">Max Flash Loan: {formatCurrency(flashLoanConfig.amount)}</p>
                      </div>
                      <div className="p-3 bg-profit bg-opacity-10 rounded-lg">
                        <ArrowUp className="text-profit text-xl" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-trading-card border-trading-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Active Opportunities</p>
                        <p className="text-2xl font-bold">{opportunities.length}</p>
                        <p className="text-xs text-profit mt-1">Real-time scanning</p>
                      </div>
                      <div className="p-3 bg-profit bg-opacity-10 rounded-lg">
                        <Search className="text-profit text-xl" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-trading-card border-trading-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Success Rate</p>
                        <p className="text-2xl font-bold text-profit">{stats.successRate.toFixed(1)}%</p>
                        <p className="text-xs text-gray-500 mt-1">Last {stats.totalTrades} trades</p>
                      </div>
                      <div className="p-3 bg-profit bg-opacity-10 rounded-lg">
                        <TrendingUp className="text-profit text-xl" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-trading-card border-trading-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Gas Price</p>
                        <p className="text-2xl font-bold text-warning">{networkStatus.ethereum.gasPrice.toFixed(0)} gwei</p>
                        <p className="text-xs text-gray-500 mt-1">Network status</p>
                      </div>
                      <div className="p-3 bg-warning bg-opacity-10 rounded-lg">
                        <Activity className="text-warning text-xl" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Flash Loan Configuration */}
                <Card className="bg-trading-card border-trading-border">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Flash Loan Configuration
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-profit rounded-full animate-pulse-profit" />
                        <span className="text-xs text-gray-400">Auto-Optimized</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-trading-dark rounded-lg border border-trading-border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">Balance Allocation</span>
                        <span className="text-sm font-medium">80%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-profit h-2 rounded-full" style={{ width: '80%' }} />
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Using {formatCurrency(wallet.balance * 0.8)} of {formatCurrency(wallet.balance)} total balance
                      </div>
                    </div>

                    <div className="p-4 bg-trading-dark rounded-lg border border-trading-border">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Flash Loan Amount</span>
                          <span className="text-sm font-bold text-profit">{formatCurrency(flashLoanConfig.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Selected Provider</span>
                          <span className="text-sm font-medium text-profit">
                            {providers.find(p => p.id === flashLoanConfig.provider)?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Flash Loan Fee</span>
                          <span className="text-sm font-medium text-profit">
                            {formatCurrency(flashLoanConfig.fee)} ({flashLoanConfig.fee === 0 ? '0%' : `${providers.find(p => p.id === flashLoanConfig.provider)?.fee}%`})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-400">Available Capital</span>
                          <span className="text-sm font-bold text-white">{formatCurrency(flashLoanConfig.availableCapital)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-gray-400">Flash Loan Provider</Label>
                      <Select value={flashLoanConfig.provider} onValueChange={updateProvider}>
                        <SelectTrigger className="bg-trading-dark border-trading-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-trading-card border-trading-border">
                          {providers.map(provider => (
                            <SelectItem key={provider.id} value={provider.id} className="text-white">
                              {provider.name} ({provider.fee}% Fee - {provider.maxLiquidity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-trading-dark rounded-lg border border-trading-border">
                      <div>
                        <div className="text-sm font-medium">Auto-Execute</div>
                        <div className="text-xs text-gray-400">Execute profitable opportunities automatically</div>
                      </div>
                      <Switch
                        checked={autoExecute}
                        onCheckedChange={toggleAutoExecute}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Arbitrage Opportunities */}
                <div className="lg:col-span-2">
                  <Card className="bg-trading-card border-trading-border">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Live Arbitrage Opportunities
                        <div className="flex items-center space-x-3">
                          <Button
                            onClick={scanOpportunities}
                            disabled={isScanning}
                            size="sm"
                            variant="outline"
                            className="bg-profit/20 text-profit border-profit/30 hover:bg-profit/30"
                          >
                            <RefreshCw className={`mr-1 h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
                            Refresh
                          </Button>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-profit rounded-full animate-pulse-profit" />
                            <span className="text-xs text-gray-400">Real-time scanning</span>
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-trading-border">
                              <th className="text-left text-xs text-gray-400 font-medium py-3">Token Pair</th>
                              <th className="text-left text-xs text-gray-400 font-medium py-3">DEX Route</th>
                              <th className="text-left text-xs text-gray-400 font-medium py-3">Price Diff</th>
                              <th className="text-left text-xs text-gray-400 font-medium py-3">Est. Profit</th>
                              <th className="text-left text-xs text-gray-400 font-medium py-3">Action</th>
                            </tr>
                          </thead>
                          <tbody className="space-y-2">
                            {opportunities.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="text-center py-8 text-gray-400">
                                  {isScanning ? 'Scanning for opportunities...' : 'No arbitrage opportunities found'}
                                </td>
                              </tr>
                            ) : (
                              opportunities.map(opportunity => (
                                <tr key={opportunity.id} className="border-b border-trading-border hover:bg-trading-dark transition-colors">
                                  <td className="py-3">
                                    <div className="flex items-center space-x-2">
                                      <div className="text-sm font-medium">{opportunity.tokenPair}</div>
                                      <Badge variant={
                                        opportunity.volume === 'High' ? 'profit' : 
                                        opportunity.volume === 'Medium' ? 'warning' : 'secondary'
                                      }>
                                        {opportunity.volume} Volume
                                      </Badge>
                                    </div>
                                  </td>
                                  <td className="py-3">
                                    <div className="text-sm text-gray-300">{opportunity.buyExchange} → {opportunity.sellExchange}</div>
                                    <div className="text-xs text-gray-500">
                                      Via {providers.find(p => p.id === opportunity.flashLoanProvider)?.name} Flash Loan
                                    </div>
                                  </td>
                                  <td className="py-3">
                                    <div className="text-sm font-medium text-profit">+{opportunity.priceDiff.toFixed(2)}%</div>
                                  </td>
                                  <td className="py-3">
                                    <div className="text-sm font-bold text-profit">{formatCurrency(opportunity.estimatedProfit)}</div>
                                    <div className="text-xs text-gray-500">After fees: {formatCurrency(opportunity.afterFeesProfit)}</div>
                                  </td>
                                  <td className="py-3">
                                    <Button
                                      onClick={() => handleExecuteArbitrage(opportunity.id)}
                                      disabled={isExecuting}
                                      size="sm"
                                      className="bg-profit hover:bg-profit/80"
                                    >
                                      {isExecuting ? 'Executing...' : 'Execute'}
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Transactions */}
              <Card className="bg-trading-card border-trading-border">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Recent Transactions
                    <Button variant="outline" size="sm">View All</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactions.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        No transactions yet
                      </div>
                    ) : (
                      transactions.slice(0, 5).map(tx => (
                        <div key={tx.hash || tx.timestamp} className="flex items-center justify-between p-3 bg-trading-dark rounded-lg border border-trading-border">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              tx.status === 'success' ? 'bg-profit bg-opacity-20' : 
                              tx.status === 'failed' ? 'bg-loss bg-opacity-20' : 'bg-warning bg-opacity-20'
                            }`}>
                              {tx.status === 'success' ? (
                                <ArrowUp className="text-profit text-sm" />
                              ) : tx.status === 'failed' ? (
                                <AlertTriangle className="text-loss text-sm" />
                              ) : (
                                <Activity className="text-warning text-sm" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{tx.tokenPair} Arbitrage</div>
                              <div className="text-xs text-gray-400">
                                {new Date(tx.timestamp).toLocaleString()}
                              </div>
                              {tx.hash && (
                                <div className="text-xs text-gray-500">
                                  Hash: {formatAddress(tx.hash)}
                                  <a 
                                    href={tx.etherscanUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="ml-1 text-profit hover:underline"
                                  >
                                    <ExternalLink className="inline w-3 h-3" />
                                  </a>
                                </div>
                              )}
                              {tx.reason && (
                                <div className="text-xs text-loss">Reason: {tx.reason}</div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-bold ${tx.profit >= 0 ? 'text-profit' : 'text-loss'}`}>
                              {tx.profit >= 0 ? '+' : ''}{formatCurrency(tx.profit)}
                            </div>
                            <div className="text-xs text-gray-400">{tx.status}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Profit Analytics */}
              <Card className="bg-trading-card border-trading-border">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Profit Analytics
                    <Select defaultValue="24h">
                      <SelectTrigger className="w-32 bg-trading-dark border-trading-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-trading-card border-trading-border">
                        <SelectItem value="24h" className="text-white">Last 24 Hours</SelectItem>
                        <SelectItem value="7d" className="text-white">Last 7 Days</SelectItem>
                        <SelectItem value="30d" className="text-white">Last 30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-trading-dark rounded-lg border border-trading-border">
                      <div className="text-2xl font-bold text-profit">{formatCurrency(stats.totalProfit)}</div>
                      <div className="text-xs text-gray-400 mt-1">Total Profit</div>
                      <div className="text-xs text-profit mt-1">
                        +{((stats.totalProfit / Math.max(wallet.balance, 1)) * 100).toFixed(1)}% ROI
                      </div>
                    </div>
                    <div className="text-center p-4 bg-trading-dark rounded-lg border border-trading-border">
                      <div className="text-2xl font-bold text-white">{stats.successfulTrades}</div>
                      <div className="text-xs text-gray-400 mt-1">Successful Trades</div>
                      <div className="text-xs text-profit mt-1">{stats.winRate.toFixed(1)}% Success Rate</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Gross Profit</span>
                      <span className="text-sm font-medium text-profit">{formatCurrency(stats.totalProfit + 45.20)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Flash Loan Fees</span>
                      <span className="text-sm font-medium text-loss">-{formatCurrency(30.00)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Gas Costs</span>
                      <span className="text-sm font-medium text-loss">-{formatCurrency(15.20)}</span>
                    </div>
                    <div className="border-t border-trading-border pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold">Net Profit</span>
                        <span className="text-sm font-bold text-profit">{formatCurrency(stats.totalProfit)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-trading-dark rounded-lg border border-trading-border">
                    <h3 className="text-sm font-semibold mb-3">Risk Metrics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Max Drawdown</span>
                        <span className="text-warning">-{stats.maxDrawdown.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Sharpe Ratio</span>
                        <span className="text-profit">{stats.sharpeRatio.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Win Rate</span>
                        <span className="text-profit">{stats.winRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'risk' && (
            <Card className="bg-trading-card border-trading-border">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Risk Management & Controls
                  <Button 
                    onClick={handleEmergencyStop}
                    variant="destructive"
                    className="bg-loss hover:bg-loss/80"
                  >
                    <StopCircle className="mr-2 h-4 w-4" />
                    Emergency Stop
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Position Limits */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-300">Position Limits</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-gray-400">Max Position Size</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Slider
                            value={[riskSettings.maxPositionSize]}
                            onValueChange={(value) => setRiskSettings(prev => ({ ...prev, maxPositionSize: value[0] }))}
                            max={100}
                            min={1}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-sm font-medium w-12">{riskSettings.maxPositionSize}%</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Current: {formatCurrency(flashLoanConfig.amount)} max flash loan
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-400">Daily Loss Limit</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Slider
                            value={[riskSettings.dailyLossLimit]}
                            onValueChange={(value) => setRiskSettings(prev => ({ ...prev, dailyLossLimit: value[0] }))}
                            max={10}
                            min={1}
                            step={0.1}
                            className="flex-1"
                          />
                          <span className="text-sm font-medium w-12">{riskSettings.dailyLossLimit}%</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Max daily loss: {formatCurrency(wallet.balance * (riskSettings.dailyLossLimit / 100))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-400">Max Concurrent Trades</Label>
                        <Input
                          type="number"
                          value={riskSettings.maxConcurrentTrades}
                          onChange={(e) => setRiskSettings(prev => ({ ...prev, maxConcurrentTrades: parseInt(e.target.value) }))}
                          min={1}
                          max={20}
                          className="bg-trading-dark border-trading-border mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Execution Controls */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-300">Execution Controls</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-gray-400">Min Profit Threshold (%)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={riskSettings.minProfitThreshold}
                          onChange={(e) => setRiskSettings(prev => ({ ...prev, minProfitThreshold: parseFloat(e.target.value) }))}
                          className="bg-trading-dark border-trading-border mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-gray-400">Max Gas Price (gwei)</Label>
                        <Input
                          type="number"
                          value={riskSettings.maxGasPrice}
                          onChange={(e) => setRiskSettings(prev => ({ ...prev, maxGasPrice: parseInt(e.target.value) }))}
                          className="bg-trading-dark border-trading-border mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-gray-400">Slippage Tolerance (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={riskSettings.slippageTolerance}
                          onChange={(e) => setRiskSettings(prev => ({ ...prev, slippageTolerance: parseFloat(e.target.value) }))}
                          className="bg-trading-dark border-trading-border mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Monitor & Alerts */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-300">Monitoring & Alerts</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-trading-dark rounded border border-trading-border">
                        <div>
                          <div className="text-sm">MEV Protection</div>
                          <div className="text-xs text-gray-400">Flashbots protection</div>
                        </div>
                        <Switch
                          checked={riskSettings.mevProtection}
                          onCheckedChange={(checked) => setRiskSettings(prev => ({ ...prev, mevProtection: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-trading-dark rounded border border-trading-border">
                        <div>
                          <div className="text-sm">Loss Alerts</div>
                          <div className="text-xs text-gray-400">Telegram notifications</div>
                        </div>
                        <Switch
                          checked={riskSettings.lossAlerts}
                          onCheckedChange={(checked) => setRiskSettings(prev => ({ ...prev, lossAlerts: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-trading-dark rounded border border-trading-border">
                        <div>
                          <div className="text-sm">Auto-Pause</div>
                          <div className="text-xs text-gray-400">On multiple failures</div>
                        </div>
                        <Switch
                          checked={riskSettings.autoPause}
                          onCheckedChange={(checked) => setRiskSettings(prev => ({ ...prev, autoPause: checked }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => {
            if (opportunities.length > 0) {
              handleExecuteArbitrage(opportunities[0].id);
            }
          }}
          disabled={isExecuting || opportunities.length === 0}
          className="w-14 h-14 rounded-full bg-profit hover:bg-profit/80 shadow-lg hover:scale-105 transition-transform"
        >
          <Play className="text-xl" />
        </Button>
      </div>
    </div>
  );
}
