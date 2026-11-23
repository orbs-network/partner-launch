import { useSearchLocation } from "@/hooks/useSearchLocation";
import { parseAnalyticsRange } from "../../../vendor/partner-analytics/src/analytics-period";

export const analyticsViews = ["overview", "live", "charts"] as const;
export type AnalyticsView = typeof analyticsViews[number];

export function useAnalyticsLocation() {
  const search = useSearchLocation();
  const params = new URLSearchParams(search);
  const requestedView = params.get("tab");
  const view = analyticsViews.find((option) => option === requestedView) ?? "overview";
  const range = parseAnalyticsRange(params.get("range"));

  function href(changes: Record<string, string>) {
    const next = new URLSearchParams({ page: "analytics", range, tab: view, ...changes });
    const workspace = params.get("workspace");
    if (workspace) next.set("workspace", workspace);
    return `?${next.toString()}`;
  }
  function change(changes: Record<string, string>) {
    window.history.replaceState(null, "", href(changes));
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
  return { range, view, href, change };
}
