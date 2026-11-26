import { Code2, Rocket, CircleAlert, CircleCheck, Globe, Info, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_GUIDE_URL, SPOT_DOCS_URL } from "@/config/links";
import { PromptDocsLink } from "../onboarding/components/integration/PromptDocsLink";
import { cn } from "@/lib/utils";
import type { useSetupStatus } from "./useSetupStatus";
import { useSpotConfigStatus } from "./useSpotConfigStatus";
import { WorkspaceEditDialog } from "./WorkspaceEditDialog";
import { RequestCard } from "./RequestCard";
import { SpotIntegrationPrompt } from "../onboarding/spot/SpotIntegrationPrompt";
import { IntegrationPrompt } from "../onboarding/components/integration/IntegrationPrompt";
import type { PendingRequest } from "./request-record";

type Note = { tone: "info" | "success" | "warning"; text: string };

/** One status message for the selected setup, most actionable first. */
function statusNote(request: PendingRequest, status: "pending" | "approved", live: boolean): Note | null {
  if (request.pendingEdit) return { tone: "warning", text: "Your earlier changes weren’t saved. Open Edit workspace to submit them again." };
  if (live) return { tone: "success", text: request.kind === "perps" ? "Approved and trading is enabled. You can start trading in your DEX." : "Approved and your Spot configuration is live." };
  if (status === "approved") return { tone: "success", text: "Your setup is approved. You can start trading in your DEX once trading is enabled." };
  const reviewed = request.kind === "perps" || request.notification === "telegram";
  if (reviewed) return { tone: "info", text: request.kind === "spot" ? "The Orbs team is reviewing your setup. Approval can take up to 48 hours. You can build your DEX while you wait." : "The Orbs team is reviewing your setup. You can build your DEX while you wait." };
  return null;
}

/** Overview of one setup: status, details and integration actions. */
export function SetupDetail({ request, status, live, cancelling, onCancelBusyChange }: {
  request: PendingRequest;
  status: "pending" | "approved";
  live: ReturnType<typeof useSetupStatus>;
  cancelling: boolean;
  onCancelBusyChange: (busy: boolean) => void;
}) {
  const spot = useSpotConfigStatus(request.kind === "spot" ? request : undefined);
  const isLive = request.kind === "perps" ? live.live : spot.ready;
  const note = statusNote(request, status, isLive);
  const showUrlBanner = request.kind === "perps" && status === "approved" && !request.appUrl;
  const showPendingInNote = status === "pending" && !isLive && note?.tone === "info";
  const NoteIcon = showPendingInNote ? LoaderCircle : note?.tone === "success" ? CircleCheck : note?.tone === "warning" ? CircleAlert : Info;
  const edit = <WorkspaceEditDialog key={request.id} request={request} disabled={cancelling} onBusyChange={onCancelBusyChange} />;
  return <>
    {note && !(showUrlBanner && note.tone === "success") ? <p role="status" className={cn("mb-4 flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm leading-relaxed",
      note.tone === "warning" ? "bg-(--warning-bg) text-(--warning-text)" : "bg-(--primary-soft) text-(--secondary-text)")}>
      <NoteIcon size={17} className={cn("mt-0.5 shrink-0", note.tone !== "warning" && "text-(--link)", showPendingInNote && "animate-spin motion-reduce:animate-none")} aria-hidden="true" /><span>{showPendingInNote ? <strong className="mb-1 block font-semibold text-(--text)">Approval pending</strong> : null}{note.text}</span></p> : null}
    {showUrlBanner ? <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl bg-(--primary-soft) px-4 py-4">
      <Globe size={22} className="shrink-0 text-(--link)" aria-hidden="true" />
      <div className="min-w-[180px] flex-1"><p className="text-sm font-semibold">One more step to enable trading</p><p className="mt-1 text-sm text-(--secondary-text)">Your setup is approved. Add your website URL once you&apos;ve published your DEX.</p></div>
      <WorkspaceEditDialog key={`${request.id}-url-banner`} request={request} disabled={cancelling} onBusyChange={onCancelBusyChange} focusUrl bannerAction />
    </div> : null}
    <RequestCard request={request} registryStatus={live.registryStatus} action={edit} hidePendingStatus={showPendingInNote} urlAction={!(request.kind === "perps" ? request.appUrl : request.dexUrl) ? <WorkspaceEditDialog key={`${request.id}-url`} request={request} disabled={cancelling} onBusyChange={onCancelBusyChange} focusUrl /> : undefined}>
      {request.kind === "perps" ? <>
        <IntegrationPrompt launchPath="creator" draft={{ partnerName: request.partnerId, displayName: request.appName, chainIds: request.chainIds, launchPath: "creator" }} trigger={<Button type="button" size="sm" disabled={cancelling} className="h-11 rounded-xl px-4 text-sm has-[>svg]:px-4"><Rocket size={16} aria-hidden="true" />Build your DEX</Button>} />
        <IntegrationPrompt guided launchPath="api" draft={{ partnerName: request.partnerId, displayName: request.appName, chainIds: request.chainIds, launchPath: "api" }} trigger={<Button type="button" variant="secondary" size="sm" disabled={cancelling} className="h-11 rounded-xl px-4 text-sm has-[>svg]:px-4"><Code2 size={16} aria-hidden="true" />API integration</Button>}><PromptDocsLink href={API_GUIDE_URL}>API integration docs</PromptDocsLink></IntegrationPrompt>
      </> : <>
        <SpotIntegrationPrompt setup={{ ...request, integrationMode: "ui" }} trigger={<Button type="button" size="sm" disabled={cancelling} className="h-11 rounded-xl px-4 text-sm has-[>svg]:px-4"><Rocket size={16} aria-hidden="true" />Build your DEX</Button>} />
        <SpotIntegrationPrompt guided setup={{ ...request, integrationMode: "existing" }} trigger={<Button type="button" variant="secondary" size="sm" disabled={cancelling} className="h-11 rounded-xl px-4 text-sm has-[>svg]:px-4"><Code2 size={16} aria-hidden="true" />API integration</Button>}><PromptDocsLink href={SPOT_DOCS_URL}>Spot integration docs</PromptDocsLink></SpotIntegrationPrompt>
      </>}
    </RequestCard>

  </>;
}
