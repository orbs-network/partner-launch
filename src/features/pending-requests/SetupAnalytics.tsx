import { BarChart3, ReceiptText, TrendingUp } from "lucide-react";
import type { PendingRequest } from "./request-record";

/** Empty analytics layout until the setup has an analytics source. */
export function SetupAnalytics({ request }: { request?: PendingRequest }) {
  const metrics = [
    { label: "Trading volume", icon: TrendingUp },
    { label: "Trades", icon: BarChart3 },
    { label: "Fees", icon: ReceiptText },
  ];
  return <section aria-label="Analytics" className="grid gap-4">
    <div className="grid gap-3 sm:grid-cols-3">
      {metrics.map(({ label, icon: Icon }) => <div key={label} className="min-w-0 rounded-[20px] border border-(--edge) bg-(--surface) p-5">
        <div className="flex items-center justify-between gap-3 text-(--muted)"><span className="text-xs font-medium">{label}</span><Icon size={17} aria-hidden="true" /></div>
        <p className="mt-5 text-[26px] leading-none font-semibold text-(--secondary-text)" aria-label={`${label}: no data`}>—</p>
        <p className="mt-2 text-xs text-(--muted)">No data yet</p>
      </div>)}
    </div>
    <div className="rounded-[22px] border border-(--edge) bg-(--surface) p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><h2 className="text-base font-semibold">Trading activity</h2><p className="mt-1 text-xs text-(--muted)">{request ? `Analytics for ${request.appName}` : "Analytics for your setup"}</p></div><span className="rounded-full bg-(--primary-soft) px-3 py-1.5 text-xs text-(--link)">No data</span></div>
      <div className="mt-5 flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-(--edge) bg-(--control-bg) px-5 text-center">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-(--primary-soft) text-(--link)"><BarChart3 size={20} aria-hidden="true" /></span>
        <p className="mt-4 text-sm font-medium text-(--text)">No analytics available yet</p>
        <p className="mt-1.5 max-w-xs text-xs leading-[1.7] text-(--muted)">Trading activity will appear here when analytics data is available.</p>
      </div>
    </div>
  </section>;
}
