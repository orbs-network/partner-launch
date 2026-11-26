import { useIntegrationPrompt, type PromptSetup } from "../../hooks/useIntegrationPrompt";
import { InlinePromptCard } from "./InlinePromptCard";

export function InlineLaunchInstructions({ draft, compact = false }: { draft?: PromptSetup; compact?: boolean }) {
  const { prompt, copyPrompt } = useIntegrationPrompt(draft, "creator");
  return <InlinePromptCard compact={compact} eyebrow="Ready-made UI" title="Build your DEX" prompt={prompt} onCopy={copyPrompt}
    description="Customize and publish your ready-made trading platform with your own branding using an AI assistant."
    helper="No coding required" />;
}
