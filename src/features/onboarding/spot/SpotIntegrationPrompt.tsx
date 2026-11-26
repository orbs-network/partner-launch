import type { ReactElement, ReactNode } from "react";
import { usePromptClipboard } from "../hooks/usePromptClipboard";
import { PromptDialog } from "../components/integration/PromptDialog";
import { createSpotIntegrationPrompt, type SpotIntegrationDetails } from "./spot-integration-prompt";
import { BuildDexDialog } from "../components/integration/BuildDexDialog";
import { InlinePromptCard } from "../components/integration/InlinePromptCard";

export function SpotIntegrationPrompt({ setup, disabled = false, trigger, triggerLabel, children, guided = false }: { setup: SpotIntegrationDetails; disabled?: boolean; trigger?: ReactElement; triggerLabel?: string; children?: ReactNode; guided?: boolean }) {
  const prompt = createSpotIntegrationPrompt(setup);
  const isApp = setup.integrationMode === "ui";
  const { copyPrompt } = usePromptClipboard(prompt, "Prompt copied", "spot-integration-prompt-copy");
  if (isApp) return <BuildDexDialog trigger={trigger} disabled={disabled}>
    <InlinePromptCard compact eyebrow="Ready-made UI" title="Build your DEX" description="" helper="" prompt={prompt} onCopy={copyPrompt} disabled={disabled}>{children}</InlinePromptCard>
  </BuildDexDialog>;
  if (guided) return <BuildDexDialog trigger={trigger} disabled={disabled} title="Spot API integration" description="Use your personalized instructions to add Spot trading to your DEX.">
    <InlinePromptCard compact eyebrow="Existing DEX" title="Add Spot to your DEX" description="" helper="" prompt={prompt} onCopy={copyPrompt} instructionsLabel="Full integration prompt" disabled={disabled}>{children}</InlinePromptCard>
  </BuildDexDialog>;
  return <PromptDialog prompt={prompt} onCopy={copyPrompt} disabled={disabled} trigger={trigger} triggerLabel={triggerLabel ?? (isApp ? "Build your DEX" : "API integration prompt")}
    title={isApp ? "Build your Spot DEX" : "Your Spot integration prompt"}
    description={isApp ? "Share this prompt with a coding assistant to customize the official Spot DEX." : "Copy this prompt for your team or a coding assistant."}>{children}</PromptDialog>;
}
