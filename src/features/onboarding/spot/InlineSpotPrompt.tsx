import { SPOT_APP_REPO_URL } from "@/config/links";
import { InlinePromptCard } from "../components/integration/InlinePromptCard";
import { usePromptClipboard } from "../hooks/usePromptClipboard";
import { createSpotIntegrationPrompt, type SpotIntegrationDetails } from "./spot-integration-prompt";

export function InlineSpotPrompt({ setup, disabled = false, compact = false }: { setup: SpotIntegrationDetails; disabled?: boolean; compact?: boolean }) {
  const prompt = createSpotIntegrationPrompt(setup);
  const { copyPrompt } = usePromptClipboard(prompt, "Prompt copied", "spot-integration-prompt-copy");
  const isApp = setup.integrationMode === "ui";
  return <InlinePromptCard compact={compact} eyebrow={isApp ? "Ready-made UI" : "Existing app"} title={isApp ? "Launch your DEX" : "Add Spot to your DEX"} prompt={prompt} onCopy={copyPrompt} instructionsLabel={isApp ? "Full launch instructions" : "Full integration prompt"} disabled={disabled}
    description={isApp ? <>Customize the <a href={SPOT_APP_REPO_URL} target="_blank" rel="noreferrer" className="text-(--link) underline underline-offset-4">official Spot app</a> with your branding and publish it to your own hosting account. Trading requires partner activation.</> : "Add Spot trading to your existing app. You can start integrating while your setup is reviewed."}
    helper="Copy these instructions for your developer or a coding agent, such as Codex or Claude, with folder access on your computer." />;
}
