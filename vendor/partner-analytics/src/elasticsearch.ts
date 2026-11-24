import {
  type AnalyticsPoint,
  type AnalyticsScope,
  type PartnerAnalyticsStats,
} from "./types.js";
import type { AnalyticsPeriod } from "../lib/analytics-range";
import {
  ACCOUNT_METRIC_FIELDS,
  type AccountMetricField,
} from "./elasticsearch-fields.js";

export { buildStatsQuery } from "./elasticsearch-query.js";

const AMOUNT_SCALE = 1_000_000;

type ElasticMetric = {
  value?: unknown;
};

type ElasticMetricBucket = {
  doc_count?: unknown;
  amount?: ElasticMetric;
};

type ElasticTradeBucket = {
  doc_count?: unknown;
  notional?: ElasticMetric;
  users?: ElasticMetric;
};

type ElasticAccountSummaryBucket = {
  latestTotals?: {
    value?: Partial<Record<AccountMetricField, unknown>>;
  };
};

type ElasticPlatformChainBucket = {
  key?: unknown;
  latest?: {
    hits?: {
      hits?: Array<{ _source?: Record<string, unknown> }>;
    };
  };
};

type ElasticLiveAccountBatchBucket = Partial<
  Record<AccountMetricField, ElasticMetric>
> & { key?: unknown };

type ElasticLiveAccountSummaryBucket = {
  chains?: {
    buckets?: Array<{
      key?: unknown;
      latestBatch?: { buckets?: ElasticLiveAccountBatchBucket[] };
    }>;
  };
};

type ElasticPlatformSummaryBucket = {
  chains?: {
    buckets?: ElasticPlatformChainBucket[];
  };
};

type ElasticMarketBucket = {
  doc_count?: unknown;
  key?: unknown;
  notional?: ElasticMetric;
  users?: ElasticMetric;
};

type ElasticMarketsBucket = {
  symbols?: { buckets?: ElasticMarketBucket[] };
};

type ElasticBucket = {
  key_as_string?: unknown;
  trades?: ElasticTradeBucket;
  accountSnapshots?: ElasticAccountSummaryBucket;
  deposits?: ElasticMetricBucket;
  withdrawals?: ElasticMetricBucket;
  liquidations?: ElasticMetricBucket;
  funding?: ElasticMetricBucket;
  platformSnapshots?: ElasticPlatformSummaryBucket;
};

type ScopedOverview = Omit<ElasticBucket, "key_as_string"> & {
  markets?: ElasticMarketsBucket;
};

type ElasticStatsResponse = {
  aggregations?: {
    overview?: ScopedOverview;
    days?: { buckets?: ElasticBucket[] };
    live?: {
      accounts?: ElasticLiveAccountSummaryBucket;
      platform?: ElasticPlatformSummaryBucket;
      trailingTrades?: ElasticTradeBucket;
    };
  };
};

function asNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function amountFrom(metric?: ElasticMetric) {
  return amountFromMicros(asNumber(metric?.value));
}

function amountFromMicros(value: number) {
  return value / AMOUNT_SCALE;
}

function latestAccountTotals(bucket?: ElasticAccountSummaryBucket) {
  const totals = bucket?.latestTotals?.value;

  return {
    volume: amountFromMicros(asNumber(totals?.volume24hMicros)),
    feeRevenue: amountFromMicros(
      asNumber(totals?.totalCommissionPaidMicros),
    ),
    upnl: amountFromMicros(asNumber(totals?.totalUPnlMicros)),
    pnl: amountFromMicros(asNumber(totals?.totalPnlMicros)),
    balance: amountFromMicros(asNumber(totals?.balanceMicros)),
  };
}

function bucketKey(value: unknown, period: AnalyticsPeriod) {
  if (typeof value !== "string") return "";
  return period.range === "24h" ? value : value.slice(0, 10);
}

function overviewFrom(response: ElasticStatsResponse) {
  return response.aggregations?.overview;
}

function latestPlatformTotals(bucket?: ElasticPlatformSummaryBucket) {
  const micros = {
    currentEquity: 0,
    grossOpenInterest: 0,
    availableBalance: 0,
    marginUsed: 0,
    upnl: 0,
  };
  const counts = {
    accounts: 0,
    activeAccounts: 0,
    openPositions: 0,
  };
  for (const chain of bucket?.chains?.buckets ?? []) {
    const source = chain.latest?.hits?.hits?.[0]?._source;
    micros.currentEquity += asNumber(source?.totalEquityMicros);
    micros.grossOpenInterest += asNumber(source?.grossOpenInterestMicros);
    micros.availableBalance += asNumber(source?.availableBalanceMicros);
    micros.marginUsed += asNumber(source?.marginUsedMicros);
    micros.upnl += asNumber(source?.totalUnrealizedPnlMicros);
    counts.accounts += asNumber(source?.userCount);
    counts.activeAccounts += asNumber(source?.activeUserCount);
    counts.openPositions += asNumber(source?.openPositionCount);
  }
  return {
    currentEquity: amountFromMicros(micros.currentEquity),
    balance: amountFromMicros(micros.currentEquity - micros.upnl),
    grossOpenInterest: amountFromMicros(micros.grossOpenInterest),
    availableBalance: amountFromMicros(micros.availableBalance),
    marginUsed: amountFromMicros(micros.marginUsed),
    upnl: amountFromMicros(micros.upnl),
    ...counts,
  };
}

function latestLiveAccountTotals(
  accounts?: ElasticLiveAccountSummaryBucket,
  platform?: ElasticPlatformSummaryBucket,
) {
  const activeChainBatches = new Map<string, number>();
  for (const chain of platform?.chains?.buckets ?? []) {
    const source = chain.latest?.hits?.hits?.[0]?._source;
    const timestamp = Date.parse(String(source?.timestamp ?? ""));
    if (asNumber(source?.userCount) > 0 && Number.isFinite(timestamp)) {
      activeChainBatches.set(String(chain.key ?? ""), timestamp);
    }
  }
  const totals = Object.fromEntries(
    ACCOUNT_METRIC_FIELDS.map((field) => [field, 0]),
  ) as Record<AccountMetricField, number>;

  for (const chain of accounts?.chains?.buckets ?? []) {
    const timestamp = activeChainBatches.get(String(chain.key ?? ""));
    if (timestamp === undefined) continue;
    const batch = (chain.latestBatch?.buckets ?? []).reduce<
      ElasticLiveAccountBatchBucket | undefined
    >((latest, candidate) => {
      const candidateTimestamp = asNumber(candidate.key);
      if (candidateTimestamp > timestamp) return latest;
      return !latest || candidateTimestamp > asNumber(latest.key)
        ? candidate
        : latest;
    }, undefined);
    for (const field of ACCOUNT_METRIC_FIELDS) {
      totals[field] += asNumber(batch?.[field]?.value);
    }
  }

  return latestAccountTotals({ latestTotals: { value: totals } });
}

function topMarkets(overview?: ScopedOverview) {
  return (overview?.markets?.symbols?.buckets ?? []).map((market) => ({
    symbol: typeof market.key === "string" ? market.key : "Unknown",
    executedNotional: amountFrom(market.notional),
    trades: asNumber(market.doc_count),
    traders: asNumber(market.users?.value),
  }));
}

function pointFrom(
  bucket: ElasticBucket,
  period: AnalyticsPeriod,
): AnalyticsPoint {
  const depositMicros = asNumber(bucket.deposits?.amount?.value);
  const withdrawalMicros = asNumber(bucket.withdrawals?.amount?.value);
  const deposits = amountFromMicros(depositMicros);
  const withdrawals = amountFromMicros(withdrawalMicros);
  const account = latestAccountTotals(bucket.accountSnapshots);
  const platform = latestPlatformTotals(bucket.platformSnapshots);
  return {
    date: bucketKey(bucket.key_as_string, period),
    volume: account.volume,
    executedNotional: amountFrom(bucket.trades?.notional),
    users: asNumber(bucket.trades?.users?.value),
    feeRevenue: account.feeRevenue,
    trades: asNumber(bucket.trades?.doc_count),
    deposits,
    withdrawals,
    netDeposits: amountFromMicros(depositMicros - withdrawalMicros),
    liquidations: asNumber(bucket.liquidations?.doc_count),
    netFunding: amountFrom(bucket.funding?.amount),
    currentEquity: platform.currentEquity,
    grossOpenInterest: platform.grossOpenInterest,
    activeAccounts: platform.activeAccounts,
    openPositions: platform.openPositions,
    availableBalance: platform.availableBalance,
    marginUsed: platform.marginUsed,
  };
}

export function parseStatsResponse(
  response: ElasticStatsResponse,
  scope: AnalyticsScope,
  period: AnalyticsPeriod,
  updatedAt = new Date().toISOString(),
): PartnerAnalyticsStats {
  const overview = overviewFrom(response);
  const live = response.aggregations?.live;
  const platform = latestPlatformTotals(live?.platform);
  const depositMicros = asNumber(overview?.deposits?.amount?.value);
  const withdrawalMicros = asNumber(overview?.withdrawals?.amount?.value);
  const deposits = amountFromMicros(depositMicros);
  const withdrawals = amountFromMicros(withdrawalMicros);
  const account = latestLiveAccountTotals(live?.accounts, live?.platform);
  const trades = asNumber(overview?.trades?.doc_count);
  const executedNotional = amountFrom(overview?.trades?.notional);

  return {
    scope,
    range: period.range,
    updatedAt,
    totals: {
      volume: amountFrom(live?.trailingTrades?.notional),
      executedNotional,
      averageTradeSize: trades > 0 ? executedNotional / trades : 0,
      users: asNumber(overview?.trades?.users?.value),
      feeRevenue: account.feeRevenue,
      upnl: platform.upnl,
      pnl: account.pnl,
      balance: platform.balance,
      trades,
      deposits,
      withdrawals,
      netDeposits: amountFromMicros(depositMicros - withdrawalMicros),
      liquidations: asNumber(overview?.liquidations?.doc_count),
      netFunding: amountFrom(overview?.funding?.amount),
      currentEquity: platform.currentEquity,
      grossOpenInterest: platform.grossOpenInterest,
      accounts: platform.accounts,
      activeAccounts: platform.activeAccounts,
      openPositions: platform.openPositions,
      availableBalance: platform.availableBalance,
      marginUsed: platform.marginUsed,
      marginUtilization: platform.currentEquity > 0
        ? platform.marginUsed / platform.currentEquity
        : 0,
    },
    series: (response.aggregations?.days?.buckets ?? []).map((bucket) =>
      pointFrom(bucket, period)),
    markets: topMarkets(overview),
  };
}
