import type { PartnerAnalyticsStats } from "../reference";
import { MetricChart, type ChartMetric } from "./MetricChart";

const metrics: readonly ChartMetric[] = [
  { key: "executedNotional", label: "Executed notional", caption: "TEE-confirmed executed position notional", kind: "bar" },
  { key: "users", label: "Traders", caption: "Unique wallets with a TEE-confirmed completed trade in each interval", kind: "bar" },
  { key: "feeRevenue", label: "Cumulative fees", caption: "Lifetime trading commissions reported by each account’s latest snapshot in the interval", kind: "line" },
  { key: "trades", label: "Trade count", caption: "TEE-confirmed executed trade events", kind: "bar" },
  { key: "netDeposits", label: "Net deposits", caption: "User collateral in minus completed withdrawals", kind: "bar" },
  { key: "liquidations", label: "Liquidated positions", caption: "Liquidated positions, after TEE confirmation", kind: "bar" },
  { key: "netFunding", label: "Net funding", caption: "Funding paid (positive) or received (negative)", kind: "line" },
  { key: "currentEquity", label: "Total equity", caption: "Latest total account collateral plus unrealized PNL snapshot in each interval", kind: "line" },
  { key: "grossOpenInterest", label: "Gross open interest", caption: "Latest gross open interest snapshot in each interval", kind: "line" },
  { key: "activeAccounts", label: "Accounts with positions", caption: "Accounts with at least one open position in the latest interval snapshot", kind: "line" },
  { key: "openPositions", label: "Open positions", caption: "Open positions in the latest interval snapshot", kind: "line" },
  { key: "availableBalance", label: "Available balance", caption: "Collateral available in the latest interval snapshot", kind: "line" },
  { key: "marginUsed", label: "Margin used", caption: "Position margin in the latest interval snapshot", kind: "line" },
];

export function AnalyticsCharts({ stats }: { stats: PartnerAnalyticsStats }) {
  return (
    <div className="grid gap-4">
      <p className="text-xs leading-relaxed text-(--muted)">{stats.range === "24h" ? "Hourly" : "Daily"} intervals in UTC. Snapshot charts use the latest value in each interval; activity charts show completed events.</p>
      <div className="grid min-w-0 gap-4 min-[780px]:grid-cols-2">{metrics.map((metric) => <MetricChart key={metric.key} data={stats.series} metric={metric} />)}</div>
    </div>
  );
}
