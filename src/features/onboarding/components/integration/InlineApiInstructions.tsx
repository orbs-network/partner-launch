import { API_GUIDE_URL } from "@/config/links";
import { useIntegrationPrompt } from "../../hooks/useIntegrationPrompt";
import { InlinePromptCard } from "./InlinePromptCard";
import { PromptDocsLink } from "./PromptDocsLink";

export function InlineApiInstructions() {
  const { prompt, copyPrompt } = useIntegrationPrompt(undefined, "api");
  return <InlinePromptCard compact eyebrow="Trading API" title="Integrate dPERPS" prompt={prompt} onCopy={copyPrompt}
    instructionsLabel="Full integration prompt"
    description="Use this prompt to add perpetual trading to your DEX or server."
    helper="Share it with your developer or a coding agent with access to your project.">
    <PromptDocsLink href={API_GUIDE_URL}>API integration docs</PromptDocsLink>
  </InlinePromptCard>;
}
