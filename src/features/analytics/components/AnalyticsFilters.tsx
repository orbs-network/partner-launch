import type { useAnalyticsLocation } from "../location";
import { analyticsViews } from "../location";
import { RANGE_LABELS, TIME_RANGES } from "../../../../vendor/partner-analytics/lib/analytics-range";
import { cn } from "@/lib/utils";
import { navigateWithinApp } from "@/hooks/useSearchLocation";

const selectClass = "min-h-11 w-full min-w-0 rounded-xl border border-(--edge) bg-(--control-bg) px-3 text-sm text-(--text) focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)";
const viewLabels = { overview: "Overview", live: "Live", charts: "Charts" };

export function AnalyticsFilters({ location }: { location: ReturnType<typeof useAnalyticsLocation> }) {
  const { range, view, change, href } = location;
  return (
    <section aria-label="Analytics filters" className="my-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-(--edge)">
      <nav aria-label="Analytics views" className="flex gap-1 max-[640px]:order-2">
        {analyticsViews.map((option) => (
          <a key={option} href={href({ tab: option })} onClick={navigateWithinApp} aria-current={view === option ? "page" : undefined} className={cn(
            "min-h-11 border-b-2 px-4 py-3 text-sm font-medium transition-colors max-[370px]:px-3",
            view === option ? "border-(--link) text-(--link)" : "border-transparent text-(--muted) hover:text-(--text)",
          )}>{viewLabels[option]}</a>
        ))}
      </nav>
      <label className="mb-3 grid w-52 min-w-0 gap-2 text-xs text-(--muted) max-[640px]:mb-0 max-[640px]:w-full">
        {view === "live" ? "Time range (period views)" : "Time range"}
        <select className={selectClass} name="analytics-range" value={range} disabled={view === "live"} onChange={(event) => change({ range: event.target.value })}>
          {TIME_RANGES.map((option) => <option key={option} value={option}>{RANGE_LABELS[option]}</option>)}
        </select>
      </label>
    </section>
  );
}
