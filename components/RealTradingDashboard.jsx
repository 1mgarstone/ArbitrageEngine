import React, { useState } from 'react';
import { RealTradingEngine } from '../trading/realTradingEngine';

export const RealTradingDashboard = () => {
  const [engine] = useState(new RealTradingEngine());
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isTrading, setIsTrading] = useState(false);

  const connectWallet = async () => {
    const privateKey = process.env.REACT_APP_PRIVATE_KEY;

    const result = await engine.initialize(privateKey);

    if (result.success) {
      setIsConnected(true);
      setWalletAddress(result.walletAddress);
      setContractAddress(result.contractAddress);

      const currentBalance = await engine.getWalletBalance();
      setBalance(currentBalance);
    } else {
      alert('Failed to connect wallet: ' + result.error);
    }
  };

  const executeRealTrade = async (opportunity) => {
    setIsTrading(true);

    try {
      const result = await engine.executeRealArbitrage(opportunity);

      if (result.success) {
        setTransactions(prev => [{
          txHash: result.txHash,
          etherscanUrl: result.etherscanUrl,
          profit: result.profit,
          timestamp: Date.now(),
          status: 'confirmed'
        }, ...prev]);

        setBalance(result.newBalance);

        alert(`Trade successful! Profit: $${result.profit.toFixed(2)}`);
      } else {
        alert(`Trade failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Trade error: ${error.message}`);
    }

    setIsTrading(false);
  };

  return (
    <div className="p-6">
      <h1>Real Flash Loan Arbitrage Trading</h1>

      <div className="mb-6">
        <div className={`p-4 rounded ${isConnected ? 'bg-green-100' : 'bg-red-100'}`}>
          <h3>Wallet Status: {isConnected ? 'Connected' : 'Disconnected'}</h3>
          {isConnected ? (
            <>
              <p>Address: {walletAddress}</p>
              <p>Contract: {contractAddress}</p>
              <p>Balance: {balance.toFixed(4)} ETH</p>
            </>
          ) : (
            <button onClick={connectWallet} className="bg-blue-500 text-white px-4 py-2 rounded">
              Connect Wallet & Deploy Contract
            </button>
          )}
        </div>
      </div>

      {isConnected && (
        <div className="mb-6">
          <h3>Live Arbitrage Opportunities</h3>
          <button 
            onClick={() => executeRealTrade({
              token: 'USDC',
              buyExchange: 'Uniswap',
              sellExchange: 'SushiSwap',
              spread: 0.15
            })}
            disabled={isTrading}
            className="bg-green-500 text-white px-6 py-3 rounded font-bold"
          >
            {isTrading ? 'Executing...' : 'EXECUTE REAL TRADE'}
          </button>
        </div>
      )}

      <div>
        <h3>Real Transaction History</h3>
        {transactions.length === 0 && <p>No transactions yet.</p>}
        {transactions.map(tx => (
          <div key={tx.txHash} className="border p-4 mb-2 rounded">
            <p>Hash: <a href={tx.etherscanUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">
              {tx.txHash}
            </a></p>
            <p>Profit: ${tx.profit.toFixed(2)}</p>
            <p>Status: {tx.status}</p>
            <p>Time: {new Date(tx.timestamp).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
