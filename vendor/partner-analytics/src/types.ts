import type { AnalyticsRange } from "../lib/analytics-range";

export type AnalyticsScope = {
  partnerId: string;
  chainIds: string[];
};

export type AnalyticsTotals = {
  volume: number;
  executedNotional: number;
  averageTradeSize: number;
  users: number;
  feeRevenue: number;
  upnl: number;
  pnl: number;
  balance: number;
  trades: number;
  deposits: number;
  withdrawals: number;
  netDeposits: number;
  liquidations: number;
  netFunding: number;
  currentEquity: number;
  grossOpenInterest: number;
  accounts: number;
  activeAccounts: number;
  openPositions: number;
  availableBalance: number;
  marginUsed: number;
  marginUtilization: number;
};

export type AnalyticsPoint = {
  date: string;
  volume: number;
  executedNotional: number;
  users: number;
  feeRevenue: number;
  trades: number;
  deposits: number;
  withdrawals: number;
  netDeposits: number;
  liquidations: number;
  netFunding: number;
  currentEquity: number;
  grossOpenInterest: number;
  activeAccounts: number;
  openPositions: number;
  availableBalance: number;
  marginUsed: number;
};

export type AnalyticsMarket = {
  symbol: string;
  executedNotional: number;
  trades: number;
  traders: number;
};

export type PartnerAnalyticsStats = {
  scope: AnalyticsScope;
  range: AnalyticsRange;
  updatedAt: string;
  totals: AnalyticsTotals;
  series: AnalyticsPoint[];
  markets: AnalyticsMarket[];
};
