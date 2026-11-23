import { Expand } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { AnalyticsPoint, MetricDataKey } from "../reference";
import { formatDay, formatMetricValue, hasMetricChartData, isCurrencyMetric, metricChartDomain } from "../reference";

export interface ChartMetric {
  key: MetricDataKey;
  label: string;
  caption: string;
  kind: "bar" | "line";
}

function MetricPlot({ data, metric, height = 240 }: { data: AnalyticsPoint[]; metric: ChartMetric; height?: number }) {
  if (!hasMetricChartData(data, metric.key)) {
    return <div className="grid place-items-center text-center text-sm text-(--muted)" style={{ height }} role="status">0 {metric.label.toLowerCase()}</div>;
  }
  const domain = metricChartDomain(data, metric.key, metric.kind === "line");
  const axisSpan = domain[1] - domain[0];
  const axes = (
    <>
      <CartesianGrid stroke="var(--edge)" vertical={false} />
      <XAxis dataKey="date" axisLine={false} tickLine={false} tickMargin={10} minTickGap={30} interval="preserveStartEnd" tickFormatter={formatDay} tick={{ fill: "var(--muted)", fontSize: 10 }} />
      <YAxis allowDecimals={isCurrencyMetric(metric.key)} axisLine={false} tickLine={false} domain={domain} tickCount={5} width={64} tickFormatter={(value) => formatMetricValue(metric.key, Number(value), axisSpan)} tick={{ fill: "var(--muted)", fontSize: 10 }} />
      <Tooltip
        contentStyle={{ background: "var(--surface)", border: "1px solid var(--edge)", borderRadius: 12, color: "var(--text)", fontSize: 12 }}
        labelFormatter={(date) => `${formatDay(String(date))} UTC`}
        formatter={(value) => [formatMetricValue(metric.key, Number(value)), metric.label]}
        cursor={metric.kind === "line" ? { stroke: "var(--muted)", strokeDasharray: "3 3" } : { fill: "var(--primary-soft)" }}
      />
    </>
  );
  const margin = { top: 10, right: 12, bottom: 8, left: 0 };
  return (
    <div className="min-w-0" aria-label={`${metric.label} by ${data.some((point) => point.date.includes("T")) ? "hour" : "day"}, UTC`}>
      <ResponsiveContainer width="100%" height={height} minWidth={0} initialDimension={{ width: 480, height }}>
        {metric.kind === "line" ? (
          <LineChart accessibilityLayer data={data} margin={margin}>
            {axes}
            <Line dataKey={metric.key} stroke="var(--link)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} type="monotone" isAnimationActive={false} />
          </LineChart>
        ) : (
          <BarChart accessibilityLayer data={data} margin={margin}>
            {axes}
            <Bar dataKey={metric.key} fill="var(--link)" fillOpacity={0.9} maxBarSize={26} radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export function MetricChart({ data, metric }: { data: AnalyticsPoint[]; metric: ChartMetric }) {
  return (
    <Card className="min-w-0 rounded-[19px] p-4 shadow-none">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">{metric.label}</h2>
          <p className="mt-1 text-[10px] leading-relaxed text-(--muted)">{metric.caption}</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="size-9 shrink-0" aria-label={`Expand ${metric.label} chart`}><Expand size={15} aria-hidden="true" /></Button>
          </DialogTrigger>
          <DialogContent className="max-h-[calc(100dvh-32px)] w-[960px] overflow-y-auto p-5 max-[480px]:p-4">
            <DialogHeader className="pr-7">
              <DialogTitle className="text-xl">{metric.label}</DialogTitle>
              <DialogDescription className="mt-2 text-xs">{metric.caption} All times are UTC.</DialogDescription>
            </DialogHeader>
            <div className="mt-6"><MetricPlot data={data} metric={metric} height={340} /></div>
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer rounded-sm text-(--link)">View chart data</summary>
              <div className="mt-3 max-h-64 overflow-auto rounded-xl border border-(--edge)">
                <table className="w-full text-left text-[11px]">
                  <caption className="sr-only">{metric.label} values by interval, UTC</caption>
                  <thead className="sticky top-0 bg-(--surface)"><tr><th scope="col" className="px-3 py-2 font-medium">Date (UTC)</th><th scope="col" className="px-3 py-2 text-right font-medium">{metric.label}</th></tr></thead>
                  <tbody>{data.map((point) => <tr key={point.date} className="border-t border-(--edge)"><th scope="row" className="px-3 py-2 font-normal">{formatDay(point.date)}</th><td className="px-3 py-2 text-right tabular-nums">{point[metric.key].toLocaleString("en-US", { maximumFractionDigits: 6 })}</td></tr>)}</tbody>
                </table>
              </div>
            </details>
          </DialogContent>
        </Dialog>
      </div>
      <MetricPlot data={data} metric={metric} />
    </Card>
  );
}
