import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SPOT_DOCS_URL } from "@/config/links";
import type { useSetupStatus } from "./useSetupStatus";
import { RequestCard } from "./RequestCard";
import { CancelSpotRequest } from "./CancelSpotRequest";
import { SpotIntegrationPrompt } from "../onboarding/spot/SpotIntegrationPrompt";
import { IntegrationPrompt } from "../onboarding/components/integration/IntegrationPrompt";
import type { PendingRequest } from "./request-record";

/** Overview of one setup, its status and available actions. */
export function SetupDetail({ request, status, live, cancelling, onCancelBusyChange, onCancelled }: {
  request: PendingRequest;
  status: "pending" | "approved";
  live: ReturnType<typeof useSetupStatus>;
  cancelling: boolean;
  onCancelBusyChange: (busy: boolean) => void;
  onCancelled: (remaining: number) => void;
}) {
  return <>
    {status === "pending" && request.kind === "spot" && request.notification === "telegram"
      ? <p className="mb-3 text-[13px] text-(--muted)">Partner approval can take up to 48 hours.</p> : null}
    <RequestCard request={request} tradingEnabled={live.tradingEnabled} registryStatus={live.registryStatus} />
    {request.kind === "perps" && (request.status === "ready" || status === "approved") ? <div className="mt-3 flex flex-wrap gap-2">
      <IntegrationPrompt launchPath="creator" draft={{ partnerName: request.partnerId, displayName: request.appName, chainIds: request.chainIds, launchPath: "creator" }} trigger={<Button type="button">Launch your DEX</Button>} />
      <IntegrationPrompt launchPath="api" draft={{ partnerName: request.partnerId, displayName: request.appName, chainIds: request.chainIds, launchPath: "api" }} trigger={<Button type="button" variant="secondary" size="sm" className="min-h-11 rounded-xl px-4 text-sm">API integration prompt</Button>} />
    </div> : null}
    {request.kind === "spot" ? <footer className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Spot request actions">
      <SpotIntegrationPrompt setup={request} disabled={cancelling} compact />
      <a href={SPOT_DOCS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-xs font-medium text-(--link) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)">Spot integration docs<ArrowUpRight size={14} aria-hidden="true" /></a>
      {status === "pending" ? <CancelSpotRequest key={request.id} request={request} onBusyChange={onCancelBusyChange} onCancelled={onCancelled} /> : null}
    </footer> : null}
  </>;
}
