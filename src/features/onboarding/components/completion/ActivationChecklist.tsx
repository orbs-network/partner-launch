import { Button } from "@/components/ui/button";
import type { OnboardingDraft } from "../../state/types";
import { hasSetupRequestReceipt } from "../../setup-request-receipt";
import { TradingActivationStatus } from "../TradingActivationStatus";
import { DepositReceipt } from "../funding/DepositReceipt";

export function ActivationChecklist({ draft, onSend, busy = false }: { draft: OnboardingDraft; onSend?: () => void; busy?: boolean }) {
  const receipt = hasSetupRequestReceipt(draft) ? draft.setupRequestReceipt : undefined;
  return (
    <section className="mt-5" aria-labelledby="activation-title">
      {receipt ? <TradingActivationStatus key={receipt.partnerId} receipt={receipt} titleId="activation-title" descriptionId="team-approval-description" /> : (
        <div className="rounded-2xl border border-(--edge) bg-(--primary-soft) p-4">
          <h2 id="activation-title" className="text-sm font-semibold text-(--link)">Ready to submit</h2>
          <p id="team-approval-description" className="mt-2 text-sm leading-[1.7] text-(--secondary-text)">
            Your setup is saved on this device. Review and submit to continue.
          </p>
          {onSend ? <Button type="button" variant="ghost" size="sm" className="mt-3 h-11 min-h-0 rounded-lg px-2 text-xs text-(--link)" onClick={onSend} disabled={busy}>Review and submit</Button> : null}
        </div>
      )}
      {Object.values(draft.fundingByChain ?? {}).flatMap(item => item.deposit?.status === "pending" ? [item.deposit] : []).map(deposit => <DepositReceipt key={`${deposit.chainId}:${deposit.hash}`} deposit={deposit} />)}
    </section>
  );
}
