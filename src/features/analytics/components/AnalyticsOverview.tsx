import { Card } from "@/components/ui/card";
import type { PartnerAnalyticsStats } from "../reference";
import { formatCurrency, formatNumber, formatPercent, marketNotionalShare, pluralizeCount } from "../reference";
import { MetricSummary, type SummaryMetric } from "./MetricSummary";

const periodMetrics: readonly SummaryMetric[] = [
  { key: "executedNotional", label: "Executed notional", format: "currency" },
  { key: "averageTradeSize", label: "Average trade size", format: "currency" },
  { key: "users", label: "Traders", format: "number" },
  { key: "trades", label: "Trades", format: "number" },
  { key: "liquidations", label: "Liquidated positions", format: "number" },
  { key: "deposits", label: "User deposits", format: "currency" },
  { key: "withdrawals", label: "User withdrawals", format: "currency" },
  { key: "netDeposits", label: "Net deposits", format: "currency" },
  { key: "netFunding", label: "Net funding", format: "currency" },
];

export function AnalyticsOverview({ stats }: { stats: PartnerAnalyticsStats }) {
  return (
    <div className="grid items-start gap-6 min-[1000px]:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <MetricSummary title="Period activity" totals={stats.totals} metrics={periodMetrics} />
      <section aria-labelledby="analytics-markets-heading" className="min-w-0">
        <h2 id="analytics-markets-heading" className="mb-3 text-sm font-medium">Top markets</h2>
        <Card className="rounded-[19px] px-4 shadow-none">
          {stats.markets.length === 0 ? (
            <p className="py-12 text-center text-sm text-(--muted)" role="status">No completed trades in this period.</p>
          ) : (
            <ol className="list-none divide-y divide-(--edge)">
              {stats.markets.slice(0, 10).map((market, index) => {
                const share = marketNotionalShare(market.executedNotional, stats.totals.executedNotional);
                return (
                  <li key={market.symbol} className="py-4">
                    <div className="flex items-baseline gap-2 text-xs">
                      <span className="w-4 shrink-0 text-[10px] text-(--muted)" aria-hidden="true">{index + 1}</span>
                      <strong className="min-w-0 font-medium wrap-anywhere">{market.symbol}</strong>
                      <span className="ml-auto shrink-0 font-medium tabular-nums">{formatCurrency(market.executedNotional, true)}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div role="meter" aria-label={`${market.symbol} share of executed notional`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Number((share * 100).toFixed(1))} className="h-1.5 flex-1 overflow-hidden rounded-full bg-(--soft)">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${share * 100}%` }} />
                      </div>
                      <span className="text-[10px] tabular-nums text-(--muted)">{formatPercent(share)}</span>
                    </div>
                    <p className="mt-2 flex flex-wrap gap-x-4 text-[10px] text-(--muted)">
                      <span>{formatNumber(market.trades)} {pluralizeCount(market.trades, "trade")}</span>
                      <span>{formatNumber(market.traders)} {pluralizeCount(market.traders, "trader")}</span>
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
      </section>
    </div>
  );
}
