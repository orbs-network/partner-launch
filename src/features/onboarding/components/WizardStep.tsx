import { AppUrlStep } from "../steps/AppUrlStep";
import { IntegrationChoiceStep } from "../steps/IntegrationChoiceStep";
import { ChainStep } from "../steps/ChainStep";
import { PartnerStep } from "../steps/PartnerStep";
import { RevenueStep } from "../steps/RevenueStep";
import { ReviewStep } from "../steps/ReviewStep";
import { DepositStep } from "../steps/DepositStep";
import { WelcomeStep } from "../steps/WelcomeStep";
import { onboardingSteps } from "../onboarding-steps";

export function WizardStep({
  step,
  busy,
  stepError = "",
  partnerCheckUnavailable = false,
  onBack,
  onNext,
  onBusyChange,
  onEdit,
  onSelectNetwork,
  onFundingConfirmed,
  onCreator,
  onSpot,
}: {
  step: number;
  busy: boolean;
  /** Validation message for this step, set only after the user pressed Next. */
  stepError?: string;
  partnerCheckUnavailable?: boolean;
  onBack?: () => void;
  onNext: () => void;
  onBusyChange: (busy: boolean) => void;
  /** Review's Edit links: open a step that returns to Review on Next. */
  onEdit: (step: number, field?: string) => void;
  onSelectNetwork: (chainId: number) => void;
  onFundingConfirmed: () => void;
  onCreator: () => void;
  onSpot: () => void;
}) {
  switch (onboardingSteps[step]?.id) {
    case "welcome":
      return <WelcomeStep onCreator={onCreator} onSpot={onSpot} />;
    case "app-url":
      return <AppUrlStep error={stepError} disabled={busy} />;
    case "integration-choice":
      return <IntegrationChoiceStep error={stepError} disabled={busy} />;
    case "networks":
      return <ChainStep error={stepError} disabled={busy} onSelect={onSelectNetwork} />;
    case "partner":
      return <PartnerStep error={stepError} unavailable={partnerCheckUnavailable} disabled={busy} />;
    case "revenue":
      return <RevenueStep error={stepError} disabled={busy} onBusyChange={onBusyChange} />;
    case "terms":
      return <ReviewStep error={stepError} onEdit={onEdit} disabled={busy} onBack={onBack} onContinue={onNext} />;
    case "funding":
      return <DepositStep disabled={busy} onBack={onBack} onBusyChange={onBusyChange} onComplete={onFundingConfirmed} />;
    default:
      return null;
  }
}
