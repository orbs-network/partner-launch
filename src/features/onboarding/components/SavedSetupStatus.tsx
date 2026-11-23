import { Clock3 } from "lucide-react";
import { hasSetupRequestReceipt } from "../setup-request-receipt";
import type { OnboardingDraft } from "../state/types";
import { TradingActivationStatus } from "./TradingActivationStatus";

export function SavedSetupStatus({ draft }: { draft: OnboardingDraft }) {
  const receipt = hasSetupRequestReceipt(draft) ? draft.setupRequestReceipt : undefined;
  if (receipt) return <div className="mt-3"><TradingActivationStatus key={receipt.partnerId} receipt={receipt} /></div>;
  return (
    <div role="note" aria-label="Trading activation requirements" className="mt-3 flex items-start gap-2.5 rounded-xl border border-(--selected-border) bg-(--primary-soft) p-3 text-(--link)">
      <Clock3 size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13px] leading-[1.6] font-semibold">Trading requires partner activation.</p>
        </div>
      </div>
    </div>
  );
}
