import { ListChecks } from "lucide-react";
import type { SpotOrderStatus } from "./order-status";

const statuses: { key: SpotOrderStatus; label: string; color: string }[] = [
  { key: "open", label: "Open", color: "bg-(--link)" },
  { key: "completed", label: "Completed", color: "bg-emerald-500" },
  { key: "partial", label: "Partially completed", color: "bg-teal-500" },
  { key: "cancelled", label: "Cancelled", color: "bg-slate-400" },
  { key: "expired", label: "Expired", color: "bg-amber-500" },
  { key: "failed", label: "Failed", color: "bg-rose-500" },
  { key: "other", label: "Other", color: "bg-violet-400" },
];

export function SpotOrderStatuses({ counts, total, days }: { counts: Record<SpotOrderStatus, number>; total: number; days: number }) {
  return <section aria-labelledby="spot-status-heading" className="rounded-[20px] border border-(--edge) bg-(--surface) p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><div className="flex items-center gap-2.5"><span className="flex size-8 items-center justify-center rounded-[10px] bg-(--primary-soft) text-(--link)"><ListChecks size={16} aria-hidden="true" /></span><h3 id="spot-status-heading" className="text-base font-semibold">Order status</h3></div><p className="mt-2 text-xs leading-relaxed text-(--muted)">Latest status of orders placed in the past {days} days</p></div>
      <p className="text-xs tabular-nums text-(--muted)">{new Intl.NumberFormat().format(total)} total</p>
    </div>
    {total > 0 ? <div className="mt-5 flex h-1.5 overflow-hidden rounded-full bg-(--control-bg)" aria-hidden="true">{statuses.map(({ key, color }) => counts[key] ? <span key={key} className={color} style={{ width: `${counts[key] / total * 100}%` }} /> : null)}</div> : null}
    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4 lg:grid-cols-7">
      {statuses.filter(item => item.key !== "other" || counts.other > 0).map(({ key, label, color }) => <div key={key} className="min-w-0"><dt className="flex items-center gap-1.5 text-xs text-(--muted)"><span className={`size-2 shrink-0 rounded-full ${color}`} aria-hidden="true" />{label}</dt><dd className="m-0 mt-1.5 pl-3.5 text-lg font-semibold tabular-nums text-(--text)">{new Intl.NumberFormat().format(counts[key])}</dd></div>)}
    </dl>
  </section>;
}
