import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import * as ethers from 'ethers';
import { arbitrageService } from "./services/arbitrage";
import { flashLoanService } from "./services/flashloan";
import { blockchainService } from "./services/blockchain";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Arbitrage endpoints
  app.get("/api/arbitrage/scan", async (req, res) => {
    try {
      const opportunities = await arbitrageService.scanForOpportunities();
      res.json({ opportunities });
    } catch (error) {
      console.error("Error scanning opportunities:", error);
      res.status(500).json({ error: "Failed to scan opportunities" });
    }
  });

  app.post("/api/arbitrage/execute", async (req, res) => {
    try {
      const { opportunityId } = req.body;
      
      if (!opportunityId) {
        return res.status(400).json({ error: "opportunityId is required" });
      }

      const result = await arbitrageService.executeArbitrage(opportunityId);
      res.json(result);
    } catch (error) {
      console.error("Error executing arbitrage:", error);
      res.status(500).json({ error: "Failed to execute arbitrage" });
    }
  });

  app.get("/api/arbitrage/history", async (req, res) => {
    try {
      const data = await arbitrageService.getHistoricalData();
      res.json(data);
    } catch (error) {
      console.error("Error getting historical data:", error);
      res.status(500).json({ error: "Failed to get historical data" });
    }
  });

  // Flash loan endpoints
  app.get("/api/flashloan/providers", async (req, res) => {
    try {
      const providers = [
        {
          id: 'balancer',
          name: 'Balancer V2',
          fee: 0,
          maxLiquidity: '$1B+',
          supportedAssets: ['ETH', 'WETH', 'DAI', 'USDC', 'USDT', 'WBTC'],
          status: 'online'
        },
        {
          id: 'dydx',
          name: 'dYdX',
          fee: 0,
          maxLiquidity: '$500M+',
          supportedAssets: ['ETH', 'DAI', 'USDC'],
          status: 'online'
        },
        {
          id: 'aave',
          name: 'Aave V3',
          fee: 0.05,
          maxLiquidity: '$2B+',
          supportedAssets: ['ETH', 'WETH', 'DAI', 'USDC', 'USDT', 'WBTC', 'LINK', 'AAVE'],
          status: 'online'
        }
      ];
      
      res.json({ providers });
    } catch (error) {
      console.error("Error getting flash loan providers:", error);
      res.status(500).json({ error: "Failed to get providers" });
    }
  });

  app.post("/api/flashloan/execute", async (req, res) => {
    try {
      const schema = z.object({
        provider: z.enum(['balancer', 'dydx', 'aave']),
        amount: z.number().positive(),
        asset: z.string(),
        targetContract: z.string(),
        params: z.string()
      });

      const { provider, amount, asset, targetContract, params } = schema.parse(req.body);
      
      // In a real implementation, you would:
      // 1. Validate the request
      // 2. Execute the flash loan
      // 3. Return the transaction hash
      
      // For now, simulate the response
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      res.json({
        success: true,
        txHash: mockTxHash,
        provider,
        amount,
        fee: flashLoanService.calculateFee(amount, provider)
      });
    } catch (error) {
      console.error("Error executing flash loan:", error);
      res.status(500).json({ error: "Failed to execute flash loan" });
    }
  });

  // Blockchain status endpoints
  app.get("/api/blockchain/status", async (req, res) => {
    try {
      const [ethGasPrice, ethBlockNumber, polygonGasPrice, polygonBlockNumber] = await Promise.all([
        blockchainService.getEthereumGasPrice(),
        blockchainService.getEthereumBlockNumber(),
        blockchainService.getPolygonGasPrice(),
        blockchainService.getPolygonBlockNumber()
      ]);

      res.json({
        ethereum: {
          connected: ethBlockNumber > 0,
          gasPrice: ethGasPrice,
          blockNumber: ethBlockNumber
        },
        polygon: {
          connected: polygonBlockNumber > 0,
          gasPrice: polygonGasPrice,
          blockNumber: polygonBlockNumber
        }
      });
    } catch (error) {
      console.error("Error getting blockchain status:", error);
      res.status(500).json({ error: "Failed to get blockchain status" });
    }
  });

  // Transaction monitoring
  app.get("/api/transaction/:hash", async (req, res) => {
    try {
      const { hash } = req.params;
      const result = await blockchainService.monitorTransaction(hash);
      res.json(result);
    } catch (error) {
      console.error("Error monitoring transaction:", error);
      res.status(500).json({ error: "Failed to monitor transaction" });
    }
  });

  // Wallet balance endpoint
  app.get("/api/wallet/:address/balance", async (req, res) => {
    try {
      const { address } = req.params;
      
      if (!ethers.isAddress(address)) {
        return res.status(400).json({ error: "Invalid address" });
      }

      // This would use your blockchain service to get the actual balance
      // For now, return a mock balance
      const mockBalance = 100.0; // $100 USDT
      
      res.json({ balance: mockBalance, address });
    } catch (error) {
      console.error("Error getting wallet balance:", error);
      res.status(500).json({ error: "Failed to get wallet balance" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
