import { IntegrationChoice } from "../components/IntegrationChoice";
import { useOnboardingStore } from "../store";

export function IntegrationChoiceStep({ error, disabled }: { error: string; disabled: boolean }) {
  const selected = useOnboardingStore(state => state.integrationMode);
  const select = useOnboardingStore(state => state.setIntegrationMode);
  return <IntegrationChoice product="Perps" selected={selected === "api" ? "existing" : selected} onSelect={value => select(value === "existing" ? "api" : value)} error={error} disabled={disabled} />;
}
