import { useId } from "react";
import { Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { METRIC_HELP, formatCurrency, formatNumber, formatPercent } from "../reference";
import type { AnalyticsTotals } from "../reference";

export interface SummaryMetric {
  key: keyof AnalyticsTotals;
  label: string;
  format: "currency" | "number" | "percent";
}

export function MetricSummary({ title, totals, metrics }: {
  title: string;
  totals: AnalyticsTotals;
  metrics: readonly SummaryMetric[];
}) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="min-w-0">
      <h2 id={headingId} className="mb-3 text-sm font-medium">{title}</h2>
      <dl className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-2 max-[400px]:grid-cols-1">
        {metrics.map(({ key, label, format }) => (
          <Card key={key} className="relative min-w-0 rounded-[19px] p-4 shadow-none">
            <dt className="flex min-h-8 items-start justify-between gap-2 text-[11px] leading-relaxed text-(--muted)">
              <span>{label}</span>
              <details className="group shrink-0">
                <summary className="cursor-pointer list-none rounded-sm text-(--muted) hover:text-(--link) [&::-webkit-details-marker]:hidden">
                  <Info size={14} aria-hidden="true" /><span className="sr-only">About {label}</span>
                </summary>
                <p className="absolute top-10 right-2 left-2 z-10 rounded-xl border border-(--edge) bg-(--surface) p-3 text-xs leading-relaxed text-(--secondary-text) shadow-lg">{METRIC_HELP[key]}</p>
              </details>
            </dt>
            <dd className="m-0 mt-1 text-[26px] leading-tight font-medium tracking-[-0.7px] tabular-nums wrap-anywhere" title={String(totals[key])}>
              {format === "currency" ? formatCurrency(totals[key], true) : format === "percent" ? formatPercent(totals[key]) : formatNumber(totals[key])}
            </dd>
          </Card>
        ))}
      </dl>
    </section>
  );
}
