import { useState } from "react";
import { SPOT_APP_REPO_URL } from "@/config/links";
import { CreatorLaunchChoice } from "../components/integration/CreatorLaunchChoice";
import { InlinePromptCard } from "../components/integration/InlinePromptCard";
import { usePromptClipboard } from "../hooks/usePromptClipboard";
import { createSpotIntegrationPrompt, type SpotIntegrationDetails } from "./spot-integration-prompt";

export function InlineSpotPrompt({ setup, disabled = false }: { setup: SpotIntegrationDetails; disabled?: boolean }) {
  const [chooseBranding, setChooseBranding] = useState(false);
  const prompt = createSpotIntegrationPrompt(setup, { chooseBranding });
  const { copyPrompt } = usePromptClipboard(prompt, "Prompt copied", "spot-integration-prompt-copy");
  const isApp = setup.integrationMode === "ui";
  return <InlinePromptCard eyebrow={isApp ? "Official app" : "Existing app"} title={isApp ? "Build your app" : "Add Spot to your app"} prompt={prompt} onCopy={copyPrompt} instructionsLabel={isApp ? "Full launch instructions" : "Full integration prompt"} disabled={disabled}
    description={isApp ? <>Customize the <a href={SPOT_APP_REPO_URL} target="_blank" rel="noreferrer" className="text-(--link) underline underline-offset-4">official Spot app</a> with your branding. Trading requires partner activation.</> : "Add Spot trading to your existing app. You can start integrating while your setup is reviewed."}
    helper="Copy these instructions for your developer or a coding agent, such as Codex or Claude, with folder access on your computer.">
    {isApp ? <div className="mt-3"><CreatorLaunchChoice disabled={disabled} checked={chooseBranding} onCheckedChange={setChooseBranding} description="Your assistant will choose missing branding details and show a preview. You’ll still approve publishing." /></div> : null}
  </InlinePromptCard>;
}
