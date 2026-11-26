import type { ReactElement, ReactNode } from "react";
import { usePromptClipboard } from "../hooks/usePromptClipboard";
import { PromptDialog } from "../components/integration/PromptDialog";
import { createSpotIntegrationPrompt, type SpotIntegrationDetails } from "./spot-integration-prompt";

export function SpotIntegrationPrompt({ setup, disabled = false, trigger, triggerLabel, children }: { setup: SpotIntegrationDetails; disabled?: boolean; trigger?: ReactElement; triggerLabel?: string; children?: ReactNode }) {
  const prompt = createSpotIntegrationPrompt(setup);
  const isApp = setup.integrationMode === "ui";
  const { copyPrompt } = usePromptClipboard(prompt, "Prompt copied", "spot-integration-prompt-copy");
  return <PromptDialog prompt={prompt} onCopy={copyPrompt} disabled={disabled} trigger={trigger} triggerLabel={triggerLabel ?? (isApp ? "Launch your DEX" : "API integration prompt")}
    title={isApp ? "Build your Spot DEX" : "Your Spot integration prompt"}
    description={isApp ? "Share this prompt with a coding assistant to customize the official Spot DEX." : "Copy this prompt for your team or a coding assistant."}>{children}</PromptDialog>;
}
