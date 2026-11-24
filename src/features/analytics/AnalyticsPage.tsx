import { lazy, Suspense, useEffect, useRef } from "react";
import { Download, RefreshCw, ShieldCheck } from "lucide-react";
import { ContentSkeleton } from "@/components/ContentSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { analyticsChain, analyticsPartner } from "@/config/analytics";
import { chainById } from "@/config/chains";
import type { WorkspaceContext } from "@/types/workspace";
import type { LoginSession } from "../login";
import { downloadPartnerAnalyticsCsv } from "../../../vendor/partner-analytics/src/utils/analytics-csv";
import { AnalyticsRequestError } from "./api";
import { useAnalyticsLocation } from "./location";
import { useAnalytics } from "./useAnalytics";
import { AnalyticsFilters } from "./components/AnalyticsFilters";
import { AnalyticsOverview } from "./components/AnalyticsOverview";
import { AnalyticsLive } from "./components/AnalyticsLive";

const AnalyticsCharts = lazy(() => import("./components/AnalyticsCharts").then((module) => ({ default: module.AnalyticsCharts })));

/** embedded: a section inside the My setups dashboard (no page landmark, focus or scroll changes). */
export function AnalyticsPage({ session, workspace, embedded = false }: { session: LoginSession; workspace?: WorkspaceContext; embedded?: boolean }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const location = useAnalyticsLocation(embedded);
  const { range, view } = location;
  const { access, stats } = useAnalytics(session, range, workspace);
  const name = workspace?.name || workspace?.partnerId || analyticsPartner.name;
  const networks = workspace === undefined ? analyticsChain.chainName : workspace.chainIds.map((id) => chainById(id)?.name ?? `Network ${id}`).join(", ");
  const error = access.error ?? stats.error;
  const denied = error instanceof AnalyticsRequestError && (error.status === 401 || error.status === 403);
  const unavailable = error instanceof AnalyticsRequestError && (error.status === 404 || error.status === 422);
  const data = !error && access.isSuccess ? stats.data : undefined;
  const busy = access.isFetching || stats.isFetching;
  useEffect(() => {
    if (embedded) return;
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [embedded]);
  const Root = embedded ? "section" : "main";
  const Heading = embedded ? "h2" : "h1";

  return (
    <Root {...(embedded ? { "aria-label": "Analytics" } : { id: "main" })} className={embedded ? "min-w-0" : "mx-auto mt-8 mb-12 w-[min(1200px,calc(100%_-_48px))] flex-1 max-[720px]:mt-5 max-[720px]:w-[calc(100%_-_24px)]"}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Heading ref={heading} tabIndex={-1} className={embedded ? "text-xl font-semibold tracking-[-0.5px] focus:outline-none" : "text-[34px] font-medium tracking-[-1.2px] focus:outline-none max-[720px]:text-[28px]"}>Analytics</Heading>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed wrap-anywhere text-(--muted)">Trading activity and account metrics for {name} on {networks}.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => { if (access.isSuccess) void stats.refetch(); else void access.refetch(); }}>
            {busy ? <Skeleton className="size-4" /> : <RefreshCw size={15} aria-hidden="true" />}Refresh
          </Button>
          <Button variant="secondary" size="sm" disabled={!data || busy} onClick={() => { if (data) downloadPartnerAnalyticsCsv(data); }}>
            <Download size={15} aria-hidden="true" />Export CSV
          </Button>
        </div>
      </header>
      <AnalyticsFilters location={location} />
      {error ? (
        <section role="alert" className="grid justify-items-start gap-3 rounded-2xl border border-(--edge) bg-(--surface) p-6">
          <ShieldCheck size={25} className="text-(--link)" aria-hidden="true" />
          <h2 className="text-lg font-medium">{denied ? "Analytics access is not available" : unavailable ? "Analytics is not available for this workspace" : "Analytics is temporarily unavailable"}</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-(--muted)">{denied
            ? `This wallet does not have analytics access for ${name}, or your sign-in could not be verified. Sign in with an authorized wallet. New setups need team activation first.`
            : unavailable ? error.message : "We couldn’t load this workspace’s analytics. Try again in a moment."}</p>
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => { if (access.isError) void access.refetch(); else void stats.refetch(); }}>Try again</Button>
        </section>
      ) : !data ? <ContentSkeleton label={access.isPending ? "Checking partner access" : "Loading analytics"} /> : (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-xs text-(--muted)" role="status">
            <p className="min-w-0 wrap-anywhere"><span className="font-medium text-(--text)">{name}</span> · {networks}</p>
            {stats.isFetching ? <span aria-label="Updating analytics"><Skeleton className="h-4 w-28" /></span> : <p>Updated <time dateTime={data.updatedAt}>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(data.updatedAt))}</time></p>}
          </div>
          {view === "overview" ? <AnalyticsOverview stats={data} /> : view === "live" ? <AnalyticsLive stats={data} /> : <Suspense fallback={<ContentSkeleton label="Loading charts" />}><AnalyticsCharts stats={data} /></Suspense>}
          <p className="mt-5 text-xs leading-relaxed text-(--muted)">{view === "live" ? "Live figures use the latest platform snapshots and do not depend on the selected time range. " : "Trading activity covers the selected time range. "}Cumulative fees are trading commissions paid by users, not partner earnings or available payouts.</p>
        </>
      )}
    </Root>
  );
}
