import type { PartnerAnalyticsStats } from "../reference";
import { MetricSummary, type SummaryMetric } from "./MetricSummary";

const accountMetrics: readonly SummaryMetric[] = [
  { key: "volume", label: "24h executed volume", format: "currency" },
  { key: "feeRevenue", label: "Cumulative fees", format: "currency" },
  { key: "balance", label: "Account balance", format: "currency" },
  { key: "upnl", label: "Unrealized PNL", format: "currency" },
  { key: "pnl", label: "Total PNL", format: "currency" },
];

const platformMetrics: readonly SummaryMetric[] = [
  { key: "accounts", label: "Accounts", format: "number" },
  { key: "activeAccounts", label: "Accounts with positions", format: "number" },
  { key: "openPositions", label: "Open positions", format: "number" },
  { key: "currentEquity", label: "Total equity", format: "currency" },
  { key: "grossOpenInterest", label: "Gross open interest", format: "currency" },
  { key: "availableBalance", label: "Available balance", format: "currency" },
  { key: "marginUsed", label: "Margin used", format: "currency" },
  { key: "marginUtilization", label: "Margin utilization", format: "percent" },
];

export function AnalyticsLive({ stats }: { stats: PartnerAnalyticsStats }) {
  return (
    <div className="grid gap-6">
      <MetricSummary title="Live account metrics" totals={stats.totals} metrics={accountMetrics} />
      <MetricSummary title="Live platform state" totals={stats.totals} metrics={platformMetrics} />
    </div>
  );
}
