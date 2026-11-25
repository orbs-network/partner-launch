import { ArrowLeft, ArrowRight, ArrowUpRight, Check, LoaderCircle } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExpandableSection } from "@/components/ExpandableSection";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SPOT_DOCS_URL } from "@/config/links";
import { OnboardingLayout } from "../components/OnboardingLayout";
import { WizardProgress } from "../components/WizardProgress";
import { StartOverButton } from "../components/StartOverButton";
import { SetupActions } from "../components/completion/SetupActions";
import { SetupLabel } from "../components/SetupLabel";
import { getStorageAvailable } from "../state/storage";
import { SpotFields } from "./SpotFields";
import { SpotSummary } from "./SpotSummary";
import { SpotSupportedChains } from "./SpotSupportedChains";
import { InlineSpotPrompt } from "./InlineSpotPrompt";
import { SpotApprovalStatus } from "./SpotApprovalStatus";
import { useSpotSetup } from "./useSpotSetup";

export function SpotSetup({ onExit, onStartOver, onPendingRequests, renderHeaderActions, notice, externalBusy = false }: {
  onExit: () => void;
  onStartOver: () => void;
  onPendingRequests?: () => void;
  renderHeaderActions?: (busy: boolean) => ReactNode;
  notice?: ReactNode;
  externalBusy?: boolean;
}) {
  const { draft, saved, step, index, error, headingRef, progress, update, selectIntegration, navigate, next, acceptPolicy, reset, edit, back, busy, submitting, checkingAppId, appIdUnavailable, fillWallet, onWalletBusyChange, returnToReview } = useSpotSetup(externalBusy);
  const { isConnected, address, status: walletStatus } = useAccount();
  const { openConnectModal } = useConnectModal();
  const needsWallet = draft.step === "deposit" && (!isConnected || !address);
  const walletConnecting = walletStatus === "connecting" || walletStatus === "reconnecting";
  const [resetOpen, setResetOpen] = useState(false);
  const resetRef = useRef<HTMLButtonElement>(null);
  const storageAvailable = getStorageAvailable();
  return (
    <OnboardingLayout headerActions={renderHeaderActions?.(busy)} notice={notice} hideDisconnectedWallet homeDisabled={busy}>
      <main id="main" className="mx-auto mt-[38px] mb-8 w-[min(640px,calc(100%-40px))] flex-1 max-[767px]:mt-3 max-[767px]:mb-0 max-[767px]:flex max-[767px]:flex-col max-[720px]:w-[calc(100%-24px)] max-[370px]:w-[calc(100%-20px)]">
        {!storageAvailable && !saved ? <p role="alert" className="mb-5 shrink-0 text-sm text-(--warning-text)">We can’t save progress in this browser. Keep this tab open until you’re done.</p> : null}
        <Card className="block overflow-hidden rounded-[32px] border border-(--panel-border) bg-(--surface) p-0 shadow-[0_12px_46px_var(--card-shadow)] max-[767px]:min-h-fit max-[767px]:flex-1 max-[720px]:rounded-3xl" aria-label="Spot setup">
          {!saved ? <WizardProgress steps={progress} step={index} onNavigate={navigate} /> : null}
          <div className={`px-8 pb-8 max-[720px]:px-[21px] max-[370px]:px-[17px] ${saved ? "pt-6" : "pt-3 max-[720px]:pt-2.5"}`}>
            <SetupLabel product="spot" />
            <h1 ref={headingRef} tabIndex={-1} className="text-[31px] leading-[1.25] font-semibold tracking-[-1px] focus:outline-none max-[720px]:text-[28px]">{saved ? "Spot setup submitted" : step.title}</h1>
            {saved ? <div className="mt-5"><SpotApprovalStatus /></div> : <p className="mt-3 text-[15px] leading-[1.7] text-(--muted) max-[720px]:text-sm">{step.intro}</p>}
            {!saved && draft.step === "review" ? <a href={SPOT_DOCS_URL} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[13px] text-(--link) hover:text-(--link-hover) hover:underline hover:underline-offset-4">Spot integration docs<ArrowUpRight size={14} aria-hidden="true" /></a> : null}
            {saved ? (
              <div>
                <InlineSpotPrompt setup={saved} disabled={busy} />
                <a href={SPOT_DOCS_URL} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[13px] text-(--link) hover:text-(--link-hover) hover:underline hover:underline-offset-4">Spot integration docs<ArrowUpRight size={14} aria-hidden="true" /></a>
                <ExpandableSection title="Setup details" disabled={busy}>
                  <div className="mt-3"><SpotSummary {...saved} /></div>
                  <p className="mt-3 text-xs leading-[1.7] text-(--muted)">Sent to the team for review. Connect your owner wallet to see it under Your workspaces.</p>
                </ExpandableSection>
                <SpotSupportedChains />
                <SetupActions onCreateNew={() => setResetOpen(true)} onOpenSetups={onPendingRequests} createNewButtonRef={resetRef} busy={busy} />
              </div>
            ) : (
              <form className="mt-6" noValidate aria-busy={submitting || checkingAppId || walletConnecting} onSubmit={(event) => { event.preventDefault(); if (needsWallet) openConnectModal?.(); else void next(); }}>
                <fieldset disabled={busy} className="m-0 min-w-0 border-0 p-0">
                  <SpotFields draft={draft} error={error} appIdUnavailable={appIdUnavailable} update={update} selectIntegration={selectIntegration} acceptPolicy={acceptPolicy} edit={edit} fillWallet={fillWallet} onWalletBusyChange={onWalletBusyChange} />
                  <div className="mt-7 flex gap-3">
                    <Button type="button" variant="ghost" className="shrink-0 px-3 text-[13px]" onClick={() => { if (!back()) onExit(); }}><ArrowLeft size={18} aria-hidden="true" />Back</Button>
                    <Button type="submit" disabled={busy || (needsWallet && (!openConnectModal || walletConnecting))} aria-busy={checkingAppId || submitting} className="min-w-0 flex-1 whitespace-normal px-3 text-[13px]">{submitting ? "Submit setup" : needsWallet ? "Connect wallet to submit" : draft.step === "deposit" ? "Submit setup" : returnToReview ? "Save changes" : "Next step"}{checkingAppId || submitting ? <LoaderCircle size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : draft.step !== "deposit" ? <ArrowRight size={18} aria-hidden="true" /> : null}</Button>
                  </div>
                </fieldset>
                <p role="status" className="sr-only">{submitting ? "Submitting your Spot setup." : checkingAppId ? "Checking Spot Partner ID availability." : ""}</p>
              </form>
            )}
          </div>
        </Card>
        {!saved ? <div className="mt-3 flex shrink-0 items-center justify-between gap-3 px-2 text-[13px] text-(--muted)" data-setup-footer="">
          <span className="flex items-center gap-1.5 leading-normal max-[370px]:max-w-[180px]"><Check size={14} className="shrink-0 text-(--icon-accent)" aria-hidden="true" />{storageAvailable ? <><span className="max-[720px]:hidden">Your progress is saved automatically</span><span className="min-[721px]:hidden">Progress saved</span></> : "Progress kept in this tab"}</span>
          <StartOverButton ref={resetRef} disabled={busy} onClick={() => setResetOpen(true)} />
        </div> : null}
      </main>
      <ConfirmDialog intent={saved ? "create-new" : "reset"} description={saved ? "Start a fresh Spot setup for another app." : "Clear your unfinished Spot details and return to the setup choices?"} returnFocusRef={resetRef} open={resetOpen} onClose={() => setResetOpen(false)} onConfirm={() => { if (!busy && reset()) { setResetOpen(false); if (!saved) onStartOver(); } }} />
    </OnboardingLayout>
  );
}
