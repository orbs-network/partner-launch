import { useEffect, useRef, type RefObject } from "react";
import { Check } from "lucide-react";
import { ExpandableSection } from "@/components/ExpandableSection";
import { Card } from "@/components/ui/card";
import { CompletionSummary } from "./components/completion/CompletionSummary";
import { BuildApp } from "./components/completion/BuildApp";
import { useSetupExport } from "./hooks/useSetupExport";
import { SharePreviewDialog } from "./components/completion/SharePreviewDialog";
import { ActivationChecklist } from "./components/completion/ActivationChecklist";
import { SetupActions } from "./components/completion/SetupActions";
import { SetupLabel } from "./components/SetupLabel";


export function SetupComplete({ onSend, onCreateNew, createNewButtonRef, busy = false }: {
  onSend: () => void;
  onCreateNew: () => void;
  createNewButtonRef: RefObject<HTMLButtonElement | null>;
  busy?: boolean;
}) {
  const { draft } = useSetupExport();
  const creator = draft.launchPath !== "api";
  const displayName = draft.displayName || draft.partnerName;
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <Card className="block rounded-[27px] border border-(--edge) bg-(--surface) p-[30px] shadow-[0_8px_32px_var(--card-shadow)] max-[767px]:min-h-fit max-[767px]:flex-1 max-[720px]:px-[21px] max-[720px]:py-[25px] max-[370px]:px-[18px] max-[370px]:py-[23px]" role="region" aria-labelledby="complete-title">
      <SetupLabel product="perps" />
      <header className="flex items-center gap-3.5 max-[720px]:gap-[11px]">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-[18px] bg-(--friendly-mint-bg) text-(--friendly-mint) max-[720px]:size-[42px]"><Check size={25} aria-hidden="true" /></span>
        <div className="min-w-0">
          <h1 id="complete-title" className="m-0 text-[27px] leading-[1.3] font-semibold tracking-[-0.85px] focus:outline-none max-[720px]:text-2xl max-[370px]:text-[22px]" ref={headingRef} tabIndex={-1} aria-describedby="team-approval-description">Setup submitted</h1>
        </div>
      </header>
      <ActivationChecklist draft={draft} onSend={onSend} busy={busy} />
      <BuildApp launchPath={draft.launchPath} draft={draft} />
      <ExpandableSection title="Setup details" id="completion-details" headingId="setup-details-title" contentId="completion-summary" disabled={busy}>
        <CompletionSummary
          displayName={draft.displayName} partnerName={draft.partnerName} chainIds={draft.chainIds} revenueWallet={draft.revenueWallet} requestedCreatorShareBps={draft.requestedCreatorShareBps} builderFeeTenthsBps={draft.builderFeeTenthsBps} launchPath={draft.launchPath}
        />
      </ExpandableSection>
      <SetupActions onCreateNew={onCreateNew} createNewButtonRef={createNewButtonRef} busy={busy}>
        {creator ? <SharePreviewDialog displayName={displayName} partnerId={draft.partnerName} brandColor={draft.brandColor} logoDataUrl={draft.logoDataUrl} /> : null}
      </SetupActions>
    </Card>
  );
}
