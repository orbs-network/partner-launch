import Papa from "papaparse";
import type { PartnerAnalyticsStats } from "../types";

type CsvCell = number | string;
type CsvRow = Record<string, CsvCell>;

const CSV_HEADERS = [
  "partnerId",
  "chainIds",
  "range",
  "updatedAt",
  "rowType",
  "date",
  "symbol",
  "rolling24hAccountVolume",
  "trailing24hExecutedVolume",
  "executedNotional",
  "averageTradeSize",
  "traders",
  "cumulativeFees",
  "trades",
  "deposits",
  "withdrawals",
  "netDeposits",
  "liquidatedPositions",
  "netFunding",
  "currentEquity",
  "grossOpenInterest",
  "accounts",
  "activeAccounts",
  "openPositions",
  "availableBalance",
  "marginUsed",
  "marginUtilization",
  "balance",
  "upnl",
  "pnl",
  "marketExecutedNotional",
  "marketTrades",
  "marketTraders",
];

function metadata(stats: PartnerAnalyticsStats): CsvRow {
  return {
    partnerId: stats.scope.partnerId,
    chainIds: stats.scope.chainIds.join("|"),
    range: stats.range,
    updatedAt: stats.updatedAt,
  };
}

export function partnerAnalyticsCsv(stats: PartnerAnalyticsStats) {
  const seriesRowType = stats.range === "24h" ? "hourly" : "daily";
  const seriesRows: CsvRow[] = stats.series.map((point) => ({
    ...metadata(stats),
    rowType: seriesRowType,
    date: point.date,
    rolling24hAccountVolume: point.volume,
    executedNotional: point.executedNotional,
    traders: point.users,
    cumulativeFees: point.feeRevenue,
    trades: point.trades,
    deposits: point.deposits,
    withdrawals: point.withdrawals,
    netDeposits: point.netDeposits,
    liquidatedPositions: point.liquidations,
    netFunding: point.netFunding,
    currentEquity: point.currentEquity,
    grossOpenInterest: point.grossOpenInterest,
    activeAccounts: point.activeAccounts,
    openPositions: point.openPositions,
    availableBalance: point.availableBalance,
    marginUsed: point.marginUsed,
  }));
  const marketRows: CsvRow[] = stats.markets.map((market) => ({
    ...metadata(stats),
    rowType: "market",
    symbol: market.symbol,
    marketExecutedNotional: market.executedNotional,
    marketTrades: market.trades,
    marketTraders: market.traders,
  }));
  const totals = stats.totals;
  const periodTotalRow: CsvRow = {
    ...metadata(stats),
    rowType: "period_total",
    executedNotional: totals.executedNotional,
    averageTradeSize: totals.averageTradeSize,
    traders: totals.users,
    trades: totals.trades,
    deposits: totals.deposits,
    withdrawals: totals.withdrawals,
    netDeposits: totals.netDeposits,
    liquidatedPositions: totals.liquidations,
    netFunding: totals.netFunding,
  };
  const liveSnapshotRow: CsvRow = {
    ...metadata(stats),
    range: "",
    rowType: "live_snapshot",
    trailing24hExecutedVolume: totals.volume,
    cumulativeFees: totals.feeRevenue,
    currentEquity: totals.currentEquity,
    grossOpenInterest: totals.grossOpenInterest,
    accounts: totals.accounts,
    activeAccounts: totals.activeAccounts,
    openPositions: totals.openPositions,
    availableBalance: totals.availableBalance,
    marginUsed: totals.marginUsed,
    marginUtilization: totals.marginUtilization,
    balance: totals.balance,
    upnl: totals.upnl,
    pnl: totals.pnl,
  };

  return Papa.unparse([
    ...seriesRows,
    ...marketRows,
    periodTotalRow,
    liveSnapshotRow,
  ], {
    columns: CSV_HEADERS,
  });
}

export function partnerAnalyticsCsvFilename(stats: PartnerAnalyticsStats) {
  const partner = stats.scope.partnerId.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const chain = stats.scope.chainIds.length === 1
    ? stats.scope.chainIds[0]
    : "all-chains";
  const date = stats.updatedAt.slice(0, 10);
  return `${partner}-analytics-${chain}-${stats.range}-${date}.csv`;
}

export function downloadPartnerAnalyticsCsv(stats: PartnerAnalyticsStats) {
  const blob = new Blob([partnerAnalyticsCsv(stats)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = partnerAnalyticsCsvFilename(stats);
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 0);
}
