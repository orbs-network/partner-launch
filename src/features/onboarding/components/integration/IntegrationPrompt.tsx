import type { ReactElement, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useIntegrationPrompt, type PromptSetup } from "../../hooks/useIntegrationPrompt";
import { PromptDialog } from "./PromptDialog";
import { BuildDexDialog } from "./BuildDexDialog";
import { InlinePromptCard } from "./InlinePromptCard";

export function IntegrationPrompt({ launchPath, draft, triggerLabel, trigger, children, guided = false }: {
  launchPath?: "creator" | "api" | null;
  draft?: PromptSetup;
  triggerLabel?: string;
  trigger?: ReactElement;
  children?: ReactNode;
  guided?: boolean;
}) {
  const creator = (launchPath ?? draft?.launchPath) !== "api";
  const { prompt, copyPrompt } = useIntegrationPrompt(draft, launchPath);
  if (creator) return <BuildDexDialog trigger={trigger ?? (triggerLabel ? <Button type="button" className="w-full">{triggerLabel}</Button> : undefined)}>
    <InlinePromptCard compact eyebrow="Ready-made UI" title="Build your DEX" description="" helper="" prompt={prompt} onCopy={copyPrompt}>{children}</InlinePromptCard>
  </BuildDexDialog>;
  if (guided) return <BuildDexDialog trigger={trigger ?? <Button type="button" className="w-full">{triggerLabel ?? "API integration prompt"}</Button>} title="API integration" description="Use your personalized instructions to add perpetual trading to your DEX or server.">
    <InlinePromptCard compact eyebrow="Trading API" title="Integrate dPERPS" description="" helper="" prompt={prompt} onCopy={copyPrompt} instructionsLabel="Full integration prompt">{children}</InlinePromptCard>
  </BuildDexDialog>;
  return <PromptDialog prompt={prompt} onCopy={copyPrompt} trigger={trigger} triggerLabel={triggerLabel ?? (creator ? "Build your DEX" : "API integration prompt")}
    title={creator ? "Build your DEX" : "Your integration prompt"}
    description={creator ? "Add your branding, review the DEX and publish it. Trading requires partner activation." : "Copy this prompt for your team or a coding assistant on a computer."}>{children}</PromptDialog>;
}
