import { ArrowRight, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OnboardingDraft } from "../../state/types";
import { IntegrationPrompt } from "../integration/IntegrationPrompt";
import { ApiIntegrationGuide } from "./ApiIntegrationGuide";

export function ApiIntegrationOption({ draft }: { draft?: OnboardingDraft }) {
  return (
    <IntegrationPrompt launchPath="api" draft={draft} trigger={
      <Button type="button" variant="secondary" className="mt-5 w-full whitespace-normal text-left">
        <Code2 size={18} aria-hidden="true" /> Add perps to your DEX with our API
        <ArrowRight size={16} className="ml-auto" aria-hidden="true" />
      </Button>
    }>
      <ApiIntegrationGuide />
    </IntegrationPrompt>
  );
}
