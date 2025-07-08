import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const flashLoanProviders = pgTable("flash_loan_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  providerKey: text("provider_key").notNull().unique(), // balancer, dydx, aave
  fee: decimal("fee", { precision: 5, scale: 4 }).notNull(), // 0.0005 for 0.05%
  maxLiquidity: text("max_liquidity"),
  supportedAssets: jsonb("supported_assets").$type<string[]>(),
  contractAddress: text("contract_address"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const arbitrageOpportunities = pgTable("arbitrage_opportunities", {
  id: serial("id").primaryKey(),
  tokenPair: text("token_pair").notNull(),
  buyExchange: text("buy_exchange").notNull(),
  sellExchange: text("sell_exchange").notNull(),
  priceDiff: decimal("price_diff", { precision: 8, scale: 4 }).notNull(),
  estimatedProfit: decimal("estimated_profit", { precision: 18, scale: 8 }).notNull(),
  afterFeesProfit: decimal("after_fees_profit", { precision: 18, scale: 8 }).notNull(),
  volume: text("volume").$type<'High' | 'Medium' | 'Low'>().notNull(),
  gasEstimate: decimal("gas_estimate", { precision: 18, scale: 8 }).notNull(),
  flashLoanProvider: text("flash_loan_provider").$type<'balancer' | 'dydx' | 'aave'>().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  hash: text("hash"),
  tokenPair: text("token_pair").notNull(),
  type: text("type").$type<'arbitrage' | 'flash_loan'>().notNull(),
  profit: decimal("profit", { precision: 18, scale: 8 }).notNull(),
  status: text("status").$type<'success' | 'failed' | 'pending'>().notNull(),
  gasUsed: decimal("gas_used", { precision: 18, scale: 8 }),
  etherscanUrl: text("etherscan_url"),
  reason: text("reason"),
  opportunityId: integer("opportunity_id").references(() => arbitrageOpportunities.id),
  flashLoanProviderId: integer("flash_loan_provider_id").references(() => flashLoanProviders.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tradingStats = pgTable("trading_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  totalProfit: decimal("total_profit", { precision: 18, scale: 8 }).default("0"),
  dailyPnL: decimal("daily_pnl", { precision: 18, scale: 8 }).default("0"),
  successRate: decimal("success_rate", { precision: 5, scale: 2 }).default("0"),
  successfulTrades: integer("successful_trades").default(0),
  totalTrades: integer("total_trades").default(0),
  maxDrawdown: decimal("max_drawdown", { precision: 5, scale: 2 }).default("0"),
  sharpeRatio: decimal("sharpe_ratio", { precision: 8, scale: 4 }).default("0"),
  winRate: decimal("win_rate", { precision: 5, scale: 2 }).default("0"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const riskSettings = pgTable("risk_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  maxPositionSize: integer("max_position_size").default(80), // percentage
  dailyLossLimit: decimal("daily_loss_limit", { precision: 5, scale: 2 }).default("2.0"), // percentage
  maxConcurrentTrades: integer("max_concurrent_trades").default(5),
  minProfitThreshold: decimal("min_profit_threshold", { precision: 5, scale: 2 }).default("0.10"), // percentage
  maxGasPrice: integer("max_gas_price").default(50), // gwei
  slippageTolerance: decimal("slippage_tolerance", { precision: 5, scale: 2 }).default("0.5"), // percentage
  mevProtection: boolean("mev_protection").default(true),
  lossAlerts: boolean("loss_alerts").default(true),
  autoPause: boolean("auto_pause").default(true),
  autoExecute: boolean("auto_execute").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertFlashLoanProviderSchema = createInsertSchema(flashLoanProviders).omit({
  id: true,
  createdAt: true,
});

export const insertArbitrageOpportunitySchema = createInsertSchema(arbitrageOpportunities).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertTradingStatsSchema = createInsertSchema(tradingStats).omit({
  id: true,
  lastUpdated: true,
});

export const insertRiskSettingsSchema = createInsertSchema(riskSettings).omit({
  id: true,
  lastUpdated: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type FlashLoanProvider = typeof flashLoanProviders.$inferSelect;
export type InsertFlashLoanProvider = z.infer<typeof insertFlashLoanProviderSchema>;

export type ArbitrageOpportunity = typeof arbitrageOpportunities.$inferSelect;
export type InsertArbitrageOpportunity = z.infer<typeof insertArbitrageOpportunitySchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type TradingStats = typeof tradingStats.$inferSelect;
export type InsertTradingStats = z.infer<typeof insertTradingStatsSchema>;

export type RiskSettings = typeof riskSettings.$inferSelect;
export type InsertRiskSettings = z.infer<typeof insertRiskSettingsSchema>;
