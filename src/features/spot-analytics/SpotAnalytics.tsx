import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, CheckCircle2, ChevronDown, Info, RefreshCw, ShoppingBag } from "lucide-react";
import { ContentSkeleton } from "@/components/ContentSkeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SpotRequest } from "../pending-requests/request-record";
import { SpotOrderActivity } from "./SpotOrderActivity";
import { SpotOrderStatuses } from "./SpotOrderStatuses";
import { countSpotStatuses } from "./order-status";
import { fetchSpotAnalytics, SpotAnalyticsError } from "./api";

const integer = new Intl.NumberFormat();

export function SpotAnalytics({ request }: { request: SpotRequest }) {
  const [days, setDays] = useState(30);
  const query = useQuery({
    queryKey: ["spot-analytics", request.partnerId, days], enabled: !!request.partnerId,
    queryFn: ({ signal }) => fetchSpotAnalytics(request.partnerId!, days, signal),
    staleTime: 30_000, refetchInterval: 60_000,
    retry: (attempt, error) => !(error instanceof SpotAnalyticsError && error.status < 500) && attempt < 1,
  });
  if (!request.partnerId) return <Message text="This setup does not have a partner ID for Spot analytics." />;
  if (query.isPending) return <ContentSkeleton label="Loading Spot analytics" />;
  if (query.isError || !query.data) return <Message text={query.error instanceof SpotAnalyticsError ? query.error.message : "Spot analytics is temporarily unavailable. Try again."} retry={() => void query.refetch()} days={days} onDaysChange={setDays} />;
  const { orders } = query.data;
  const statusCounts = countSpotStatuses(orders);
  const completed = statusCounts.completed;
  const priced = orders.filter(order => order.orderValueUsd !== null);
  const estimatedValue = priced.reduce((sum, order) => sum + order.orderValueUsd!, 0);
  const cards = [
    { label: "Orders", value: integer.format(orders.length), note: `Past ${days} days`, Icon: ShoppingBag },
    { label: "Completed orders", value: integer.format(completed), note: `Past ${days} days`, Icon: CheckCircle2 },
    { label: "Placed order value", value: priced.length ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(estimatedValue) : "—", note: `${integer.format(priced.length)} of ${integer.format(orders.length)} orders priced`, Icon: BarChart3 },
  ];
  return <section aria-label="Spot analytics" className="grid gap-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Spot analytics</h2><p className="mt-1 text-sm text-(--muted)">Order activity for {request.appName}</p></div><div className="flex flex-wrap items-center gap-2"><RangeSelector days={days} onChange={setDays} /><Button type="button" variant="secondary" size="sm" className="min-h-11 px-4" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw size={15} aria-hidden="true" />Refresh</Button></div></div>
    <div className="grid gap-3 sm:grid-cols-3">{cards.map(({ label, value, note, Icon }) => <article key={label} className="min-w-0 rounded-[20px] border border-(--edge) bg-(--surface) p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><h3 className="text-xs font-medium text-(--muted)">{label}</h3><span className="flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-(--primary-soft) text-(--link)"><Icon size={17} aria-hidden="true" /></span></div><p className="mt-4 text-[28px] leading-tight font-semibold tracking-[-0.6px] tabular-nums wrap-anywhere text-(--text)" title={label === "Placed order value" && priced.length ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(estimatedValue) : undefined}>{value}</p><p className="mt-1.5 text-xs text-(--muted)">{note}</p></article>)}</div>
    <SpotOrderStatuses counts={statusCounts} total={orders.length} days={days} />
    <SpotOrderActivity orders={orders} />
    <details className="group rounded-[16px] border border-(--edge) bg-(--surface) px-4 text-(--muted)">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-xs font-medium text-(--secondary-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring) [&::-webkit-details-marker]:hidden"><Info size={15} className="text-(--link)" aria-hidden="true" /><span>About this data</span><span className="ml-auto text-[11px] text-(--muted) max-[480px]:hidden">Placed value is not executed volume</span><ChevronDown size={15} className="transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" /></summary>
      <p className="pb-4 text-xs leading-relaxed">Placed order value uses available input-token prices and includes pending and unsuccessful orders; it is not executed trading volume or fees. Order history combines both Spot services and excludes ambiguous adapter mappings and orders without valid placement dates.</p>
    </details>
  </section>;
}

function RangeSelector({ days, onChange }: { days: number; onChange: (value: number) => void }) {
  return <><label className="sr-only" htmlFor="spot-analytics-range">Time range</label>
    <Select value={String(days)} onValueChange={value => onChange(Number(value))}>
      <SelectTrigger id="spot-analytics-range"><SelectValue /></SelectTrigger>
      <SelectContent>{[7, 30, 90].map(value => <SelectItem key={value} value={String(value)}>Past {value} days</SelectItem>)}</SelectContent>
    </Select>
  </>;
}

function Message({ text, retry, days, onDaysChange }: { text: string; retry?: () => void; days?: number; onDaysChange?: (days: number) => void }) {
  return <section aria-label="Spot analytics" className="rounded-[22px] border border-(--edge) bg-(--surface) p-8 text-center"><BarChart3 size={25} className="mx-auto text-(--link)" aria-hidden="true" /><h2 className="mt-4 text-lg font-semibold">Spot analytics unavailable</h2><p role="status" className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-(--muted)">{text}</p><div className="mt-4 flex flex-wrap items-center justify-center gap-2">{days && onDaysChange ? <RangeSelector days={days} onChange={onDaysChange} /> : null}{retry ? <Button type="button" variant="secondary" onClick={retry}>Try again</Button> : null}</div></section>;
}
