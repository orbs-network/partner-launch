import { useOnboardingStore } from "./store";
import { SetupSummary } from "./components/SetupSummary";

export function ReviewSummary({ onEdit, disabled }: {
  onEdit: (step: number) => void;
  disabled: boolean;
}) {
  const draft = useOnboardingStore();
  return <SetupSummary draft={draft} onEdit={onEdit} disabled={disabled} />;
}
