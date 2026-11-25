import { ArrowUpRight, CircleAlert, CircleCheck, Info, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SPOT_DOCS_URL } from "@/config/links";
import { cn } from "@/lib/utils";
import type { useSetupStatus } from "./useSetupStatus";
import { useSpotConfigStatus } from "./useSpotConfigStatus";
import { WorkspaceEditDialog } from "./WorkspaceEditDialog";
import { RequestCard } from "./RequestCard";
import { CancelSpotRequest } from "./CancelSpotRequest";
import { SpotIntegrationPrompt } from "../onboarding/spot/SpotIntegrationPrompt";
import { IntegrationPrompt } from "../onboarding/components/integration/IntegrationPrompt";
import type { PendingRequest } from "./request-record";

type Note = { tone: "info" | "success" | "warning"; text: string };

/** One status message for the selected setup, most actionable first. */
function statusNote(request: PendingRequest, status: "pending" | "approved", live: boolean): Note | null {
  if (request.pendingEdit) return { tone: "warning", text: "Your earlier changes weren’t saved. Open Edit workspace to submit them again." };
  const missingUrl = request.kind === "perps" && !request.appUrl ? " Add your app URL with Edit workspace — your app needs it to work." : "";
  if (live) return { tone: "success", text: request.kind === "perps" ? `Approved and trading is enabled. You can start trading in your app.${missingUrl}` : "Approved and your Spot configuration is live." };
  if (status === "approved") return { tone: "success", text: `Your setup is approved. You can start trading in your app once trading is enabled.${missingUrl}` };
  const reviewed = request.kind === "perps" || request.notification === "telegram";
  if (reviewed) return { tone: "info", text: `The Orbs team is reviewing your setup. Approval can take up to 48 hours.${missingUrl}` };
  return missingUrl ? { tone: "warning", text: missingUrl.trim() } : null;
}

/** Overview of one setup: status, details and integration actions. */
export function SetupDetail({ request, status, live, cancelling, onCancelBusyChange, onCancelled }: {
  request: PendingRequest;
  status: "pending" | "approved";
  live: ReturnType<typeof useSetupStatus>;
  cancelling: boolean;
  onCancelBusyChange: (busy: boolean) => void;
  onCancelled: (remaining: number) => void;
}) {
  const spot = useSpotConfigStatus(request.kind === "spot" ? request : undefined);
  const isLive = request.kind === "perps" ? live.live : spot.ready;
  const note = statusNote(request, status, isLive);
  const showPendingInNote = status === "pending" && !isLive && note?.tone === "info";
  const NoteIcon = showPendingInNote ? LoaderCircle : note?.tone === "success" ? CircleCheck : note?.tone === "warning" ? CircleAlert : Info;
  const edit = <WorkspaceEditDialog key={request.id} request={request} disabled={cancelling} onBusyChange={onCancelBusyChange} />;
  return <>
    {note ? <p role="status" className={cn("mb-4 flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm leading-relaxed",
      note.tone === "warning" ? "bg-(--warning-bg) text-(--warning-text)" : "bg-(--primary-soft) text-(--secondary-text)")}>
      <NoteIcon size={17} className={cn("mt-0.5 shrink-0", note.tone !== "warning" && "text-(--link)", showPendingInNote && "animate-spin motion-reduce:animate-none")} aria-hidden="true" /><span>{showPendingInNote ? <strong className="font-semibold text-(--text)">Approval pending · </strong> : null}{note.text}</span></p> : null}
    <RequestCard request={request} registryStatus={live.registryStatus} action={edit} hidePendingStatus={showPendingInNote} />
    <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Integration actions">
      {request.kind === "perps" ? <>
        {request.integrationMode !== "api" ? <IntegrationPrompt launchPath="creator" draft={{ partnerName: request.partnerId, displayName: request.appName, chainIds: request.chainIds, launchPath: "creator" }} trigger={<Button type="button" size="sm" disabled={cancelling} className="h-11 rounded-xl px-4 text-sm">Launch your DEX</Button>} /> : null}
        {request.integrationMode !== "ui" ? <IntegrationPrompt launchPath="api" draft={{ partnerName: request.partnerId, displayName: request.appName, chainIds: request.chainIds, launchPath: "api" }} trigger={<Button type="button" variant={request.integrationMode === "api" ? "default" : "secondary"} size="sm" disabled={cancelling} className="h-11 rounded-xl px-4 text-sm">API integration prompt</Button>} /> : null}
      </> : <>
        <SpotIntegrationPrompt setup={request} disabled={cancelling} compact />
        <a href={SPOT_DOCS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-(--link) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)">Spot integration docs<ArrowUpRight size={14} aria-hidden="true" /></a>
      </>}
    </div>
    {request.kind === "spot" && request.status === "pending" ? <footer className="mt-4 flex justify-end" aria-label="Spot request actions">
      <CancelSpotRequest key={request.id} request={request} onBusyChange={onCancelBusyChange} onCancelled={onCancelled} />
    </footer> : null}
  </>;
}
