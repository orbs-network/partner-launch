import type { AnalyticsPoint } from "../types";

export type MetricDataKey = Exclude<keyof AnalyticsPoint, "date">;

const CURRENCY_METRICS = new Set<MetricDataKey>([
  "volume",
  "executedNotional",
  "feeRevenue",
  "deposits",
  "withdrawals",
  "netDeposits",
  "netFunding",
  "currentEquity",
  "grossOpenInterest",
  "availableBalance",
  "marginUsed",
]);

export function isCurrencyMetric(dataKey: MetricDataKey) {
  return CURRENCY_METRICS.has(dataKey);
}

export function emptyMetricChartMessage(label: string) {
  return `0 ${label}`;
}

export function hasMetricChartData(
  data: AnalyticsPoint[],
  dataKey: MetricDataKey,
) {
  return data.some((point) => {
    const value = point[dataKey];
    return Number.isFinite(value) && value !== 0;
  });
}

export function metricChartDomain(
  data: AnalyticsPoint[],
  dataKey: MetricDataKey,
  line: boolean,
): [number, number] {
  const values = data
    .map((point) => point[dataKey])
    .filter(Number.isFinite);
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (!line) return [Math.min(0, min), Math.max(0, max)];

  const spread = max - min;
  const padding = spread > 0
    ? spread * 0.08
    : Math.max(Math.abs(max) * 0.02, 1);
  return [min - padding, max + padding];
}
