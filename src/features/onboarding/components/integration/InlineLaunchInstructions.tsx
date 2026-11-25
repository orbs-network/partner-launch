import { FRONTEND_REPO_URL } from "@/config/links";
import { useIntegrationPrompt, type PromptSetup } from "../../hooks/useIntegrationPrompt";
import { InlinePromptCard } from "./InlinePromptCard";

export function InlineLaunchInstructions({ draft, compact = false }: { draft?: PromptSetup; compact?: boolean }) {
  const { prompt, copyPrompt } = useIntegrationPrompt(draft, "creator");
  return <InlinePromptCard compact={compact} eyebrow="Ready-made UI" title="Launch your DEX" prompt={prompt} onCopy={copyPrompt}
    description={<>Customize the <a href={FRONTEND_REPO_URL} target="_blank" rel="noreferrer" className="text-(--link) underline underline-offset-4">official dPERPS app</a> with your branding and publish it to your own hosting account. Trading requires partner activation.</>}
    helper="Copy these instructions for a coding agent, such as Codex or Claude, with folder access on your computer." />;
}
