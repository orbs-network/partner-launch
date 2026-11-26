import type { ReactElement, ReactNode } from "react";
import { useIntegrationPrompt, type PromptSetup } from "../../hooks/useIntegrationPrompt";
import { PromptDialog } from "./PromptDialog";

export function IntegrationPrompt({ launchPath, draft, triggerLabel, trigger, children }: {
  launchPath?: "creator" | "api" | null;
  draft?: PromptSetup;
  triggerLabel?: string;
  trigger?: ReactElement;
  children?: ReactNode;
}) {
  const creator = (launchPath ?? draft?.launchPath) !== "api";
  const { prompt, copyPrompt } = useIntegrationPrompt(draft, launchPath);
  return <PromptDialog prompt={prompt} onCopy={copyPrompt} trigger={trigger} triggerLabel={triggerLabel ?? (creator ? "Launch your DEX in 2 minutes" : "API integration prompt")}
    title={creator ? "Build your DEX" : "Your integration prompt"}
    description={creator ? "Add your branding, review the DEX and publish it. Trading requires partner activation." : "Copy this prompt for your team or a coding assistant on a computer."}>{children}</PromptDialog>;
}
