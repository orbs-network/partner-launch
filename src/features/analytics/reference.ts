// Reuse the analytics app's metric definitions and calculations in both clients.
export type { AnalyticsMarket, AnalyticsPoint, AnalyticsTotals, PartnerAnalyticsStats } from "../../../vendor/partner-analytics/src/types";
export { METRIC_HELP } from "../../../vendor/partner-analytics/src/metric-help";
export { formatCurrency, formatNumber, formatPercent, formatDay, formatMetricValue, pluralizeCount } from "../../../vendor/partner-analytics/src/utils/formatters";
export { hasMetricChartData, isCurrencyMetric, metricChartDomain } from "../../../vendor/partner-analytics/src/utils/chart-data";
export type { MetricDataKey } from "../../../vendor/partner-analytics/src/utils/chart-data";
export { marketNotionalShare } from "../../../vendor/partner-analytics/src/utils/top-markets";
