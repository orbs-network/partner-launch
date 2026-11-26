import { SPOT_DOCS_URL } from "@/config/links";
import { InlinePromptCard } from "../components/integration/InlinePromptCard";
import { usePromptClipboard } from "../hooks/usePromptClipboard";
import { createSpotIntegrationPrompt, type SpotIntegrationDetails } from "./spot-integration-prompt";

export function InlineSpotPrompt({ setup, disabled = false, compact = false }: { setup: SpotIntegrationDetails; disabled?: boolean; compact?: boolean }) {
  const prompt = createSpotIntegrationPrompt(setup);
  const { copyPrompt } = usePromptClipboard(prompt, "Prompt copied", "spot-integration-prompt-copy");
  const isApp = setup.integrationMode === "ui";
  return <InlinePromptCard compact={compact} eyebrow={isApp ? "Ready-made UI" : "Existing DEX"} title={isApp ? "Build your DEX" : "Add Spot to your DEX"} prompt={prompt} onCopy={copyPrompt} instructionsLabel={isApp ? "Full launch instructions" : "Full integration prompt"} docsUrl={isApp ? undefined : SPOT_DOCS_URL} disabled={disabled}
    description={isApp ? "Customize and publish your ready-made trading platform with your own branding using an AI assistant." : "Integrate Spot trading into your existing DEX using your personalized setup instructions and an AI coding agent or developer."}
    helper={isApp ? "No coding required" : "Copy these instructions for your developer or a coding agent, such as Codex or Claude, with folder access on your computer."} />;
}
