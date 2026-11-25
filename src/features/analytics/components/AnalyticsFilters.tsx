import type { useAnalyticsLocation } from "../location";
import { analyticsViews } from "../location";
import { RANGE_LABELS, TIME_RANGES } from "../../../../vendor/partner-analytics/lib/analytics-range";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { navigateWithinApp } from "@/hooks/useSearchLocation";

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
      <div className="mb-3 grid w-52 min-w-0 gap-2 text-xs text-(--muted) max-[640px]:mb-0 max-[640px]:w-full">
        <label htmlFor="analytics-range">{view === "live" ? "Time range (period views)" : "Time range"}</label>
        <Select name="analytics-range" value={range} disabled={view === "live"} onValueChange={(value) => change({ range: value })}>
          <SelectTrigger id="analytics-range" className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>{TIME_RANGES.map((option) => <SelectItem key={option} value={option}>{RANGE_LABELS[option]}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </section>
  );
}
