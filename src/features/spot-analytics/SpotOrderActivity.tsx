import { BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SpotOrder } from "./api";

const weekday = new Intl.DateTimeFormat(undefined, { weekday: "short", timeZone: "UTC" });
const fullDate = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const dateFromKey = (key: string) => new Date(`${key}T00:00:00Z`);

/** Submission dates are grouped in UTC. */
export function SpotOrderActivity({ orders }: { orders: SpotOrder[] }) {
  const today = new Date();
  const midnight = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(midnight - (6 - index) * 86_400_000);
    return { date: date.toISOString().slice(0, 10), count: 0 };
  });
  const counts = new Map(days.map(day => [day.date, day]));
  for (const order of orders) {
    const day = counts.get(new Date(order.timestamp).toISOString().slice(0, 10));
    if (day) day.count += 1;
  }
  const total = days.reduce((sum, day) => sum + day.count, 0);
  return <section aria-labelledby="spot-activity-title" className="min-w-0 rounded-[20px] border border-(--edge) bg-(--surface) p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><div className="flex items-center gap-2.5"><span className="flex size-8 items-center justify-center rounded-[10px] bg-(--primary-soft) text-(--link)"><BarChart3 size={16} aria-hidden="true" /></span><h3 id="spot-activity-title" className="text-base font-semibold">Order activity</h3></div><p className="mt-2 text-xs text-(--muted)">Daily orders · Past 7 days · UTC</p></div>
      <div className="text-right"><p className="text-xl font-semibold tabular-nums text-(--text)">{new Intl.NumberFormat().format(total)}</p><p className="mt-0.5 text-xs text-(--muted)">orders in 7 days</p></div>
    </div>
    <div className="mt-5 min-w-0" aria-label="Daily submitted orders, past 7 days in UTC">
      <ResponsiveContainer width="100%" height={220} minWidth={0} initialDimension={{ width: 480, height: 220 }}>
        <BarChart accessibilityLayer data={days} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="35%">
          <CartesianGrid vertical={false} stroke="var(--edge)" strokeDasharray="3 4" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tickMargin={12} interval={0} tickFormatter={value => weekday.format(dateFromKey(String(value)))} tick={{ fill: "var(--muted)", fontSize: 11 }} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={30} tickCount={4} domain={[0, (maximum: number) => Math.max(2, Math.ceil(maximum))]} tick={{ fill: "var(--muted)", fontSize: 11 }} />
          <Tooltip cursor={{ fill: "var(--primary-soft)", opacity: 0.55 }} contentStyle={{ background: "var(--surface)", border: "1px solid var(--edge)", borderRadius: 12, color: "var(--text)", fontSize: 12 }} labelFormatter={value => `${fullDate.format(dateFromKey(String(value)))} · UTC`} formatter={value => [new Intl.NumberFormat().format(Number(value)), "Orders"]} />
          <Bar dataKey="count" name="Orders" fill="var(--link)" maxBarSize={38} radius={[6, 6, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
      <table className="sr-only"><caption>Daily submitted orders, UTC</caption><thead><tr><th scope="col">Date</th><th scope="col">Orders</th></tr></thead><tbody>{days.map(day => <tr key={day.date}><th scope="row">{fullDate.format(dateFromKey(day.date))}</th><td>{day.count}</td></tr>)}</tbody></table>
    </div>
  </section>;
}
