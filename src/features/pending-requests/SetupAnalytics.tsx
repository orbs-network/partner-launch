import { lazy, Suspense } from "react";
import { ContentSkeleton } from "@/components/ContentSkeleton";
import type { PendingRequest } from "./request-record";

const SpotAnalytics = lazy(() => import("../spot-analytics/SpotAnalytics").then(module => ({ default: module.SpotAnalytics })));
const AnalyticsPage = lazy(() => import("../analytics/AnalyticsPage").then(module => ({ default: module.AnalyticsPage })));

export function SetupAnalytics({ request, address }: {
  request: PendingRequest;
  address: string;
}) {
  if (request.kind === "spot") return <Suspense fallback={<ContentSkeleton label="Loading Spot analytics" />}><SpotAnalytics request={request} /></Suspense>;
  const workspace = { key: request.id, revision: request.savedAt, name: request.appName, partnerId: request.partnerId, chainIds: request.chainIds };
  return <Suspense fallback={<ContentSkeleton label="Loading analytics" />}><AnalyticsPage session={{ address }} workspace={workspace} embedded /></Suspense>;
}
