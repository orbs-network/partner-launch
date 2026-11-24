import { ReviewSummary } from "../ReviewSummary";
import { TermsStep } from "./TermsStep";

export function ReviewStep({ error, onEdit, disabled, onBack, onContinue }: {
  error?: string;
  onEdit: (step: number, field?: string) => void;
  disabled: boolean;
  onBack?: () => void;
  onContinue: () => void;
}) {
  return (
    <>
      <ReviewSummary onEdit={onEdit} disabled={disabled} />
      <TermsStep error={error} disabled={disabled} onBack={onBack} onFinish={onContinue} />
    </>
  );
}
