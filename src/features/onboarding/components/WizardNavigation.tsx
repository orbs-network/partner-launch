import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FUNDING_STEP, NETWORKS_STEP, TERMS_STEP } from "../onboarding-steps";

export function WizardNavigation({
  step,
  busy,
  canContinue,
  continueLabel,
  checkingPartner,
  onBack,
}: {
  step: number;
  busy: boolean;
  canContinue: boolean;
  continueLabel: string;
  checkingPartner: boolean;
  onBack: () => void;
}) {
  // Review and Deposit render their own navigation and guarded actions.
  if (step === TERMS_STEP || step === FUNDING_STEP) return null;
  return (
    <footer className="px-8 pt-1 pb-[29px] max-[720px]:px-[21px] max-[720px]:pb-[23px] max-[370px]:px-[17px]">
      <div className="flex items-center gap-3 max-[720px]:gap-2.5">
        {step > 0 ? (
          <Button
            variant="ghost"
            className="min-w-[85px] bg-transparent text-[13px] text-(--muted) hover:enabled:bg-(--control-hover) hover:enabled:text-(--link) disabled:text-(--disabled-text) max-[720px]:min-w-[77px]"
            type="button"
            onClick={onBack}
            disabled={busy}
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Back
          </Button>
        ) : null}
        {step !== NETWORKS_STEP ? (
          <Button
            className="flex-1"
            form="onboarding-step"
            type="submit"
            disabled={!canContinue}
            aria-busy={checkingPartner}
          >
            {continueLabel}
            {checkingPartner ? <LoaderCircle size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}
          </Button>
        ) : null}
        <span role="status" className="sr-only">{checkingPartner ? "Checking Partner ID availability." : ""}</span>
      </div>
    </footer>
  );
}
