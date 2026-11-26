import { useId, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Check, Code2, Copy, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromptDocsLink } from "./PromptDocsLink";
import { PromptDialog } from "./PromptDialog";
import { CodingAgentLinks } from "./CodingAgentLinks";
import { BuildDexDialog } from "./BuildDexDialog";

/** Shared launch card and prompt dialog for Spot and Perps. */
export function InlinePromptCard({ eyebrow, title, description, helper, children, prompt, onCopy, instructionsLabel = "Full launch instructions", docsUrl, disabled = false, compact = false }: {
  eyebrow: string;
  title: string;
  description: ReactNode;
  helper: ReactNode;
  children?: ReactNode;
  prompt: string;
  onCopy: () => Promise<boolean>;
  instructionsLabel?: string;
  docsUrl?: string;
  disabled?: boolean;
  compact?: boolean;
}) {
  const titleId = useId();
  const launch = instructionsLabel === "Full launch instructions";
  const label = launch ? "Build your DEX" : "Integrate Spot";
  if (compact) return <section className="rounded-[22px] border border-(--edge) bg-(--control-bg) p-5 max-[480px]:p-4" aria-labelledby={titleId}>
    <div>
      <h2 id={titleId} className="text-base font-semibold">Open your prompt in an AI coding agent</h2>
      <p className="mt-2 text-sm leading-relaxed text-(--secondary-text)">Choose your preferred agent, or copy the prompt below to use it elsewhere.</p>
      <CodingAgentLinks prompt={prompt} onCopy={onCopy} />
      <a href="https://chatgpt.com/features/codex-get-started/" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-[13px] font-medium text-(--link) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)">New to AI coding agents? Get started <ArrowUpRight size={14} aria-hidden="true" /></a>
    </div>
    <div className="mt-4 border-t border-(--edge) pt-5">
      <h3 className="text-base font-semibold">Or copy your setup prompt</h3>
      <p className="mt-2 text-sm leading-relaxed text-(--secondary-text)">Copy and paste your personalized instructions into your coding agent.</p>
      <Button type="button" variant="secondary" disabled={disabled} className="mt-4 w-full" onClick={() => { void onCopy(); }}><Copy size={17} aria-hidden="true" />Copy setup prompt</Button>
      <div className="flex justify-center"><PromptDialog prompt={prompt} onCopy={onCopy} title={launch ? "Build your DEX" : "Your integration prompt"} description="Copy this prompt for your developer or a coding assistant."
        trigger={<Button type="button" variant="link" disabled={disabled} className="min-h-11">View full instructions</Button>} /></div>
    </div>
    <div className="flex flex-wrap items-center gap-x-4">
      {docsUrl ? <PromptDocsLink href={docsUrl}>Spot integration docs</PromptDocsLink> : null}
      {children}
    </div>
  </section>;
  return <section className={`${compact ? "mt-0" : "mt-6"} rounded-[22px] border border-(--edge) bg-(--control-bg) p-5 max-[480px]:p-4`} aria-labelledby={titleId}>
    <div className="flex items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-(--primary-soft) text-(--link)" aria-hidden="true">{launch ? <LayoutTemplate size={21} /> : <Code2 size={21} />}</span>
      <div><p className="text-xs font-medium text-(--muted)">Next step</p><h2 id={titleId} className="mt-0.5 text-base font-semibold">{title}</h2></div>
    </div>
    <p className="mt-4 text-sm leading-[1.7] text-(--secondary-text)">{description}</p>
    {launch ? <p className="mt-2 flex items-center gap-1.5 text-[13px] leading-[1.7] text-(--muted)"><Check size={16} className="shrink-0 text-(--friendly-mint)" aria-hidden="true" />{helper}</p> : null}
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      {launch ? <BuildDexDialog disabled={disabled}><InlinePromptCard compact eyebrow={eyebrow} title={title} description={description} helper={helper} prompt={prompt} onCopy={onCopy} instructionsLabel={instructionsLabel} disabled={disabled} /></BuildDexDialog>
        : <BuildDexDialog disabled={disabled} title="Spot API integration" description="Use your personalized instructions to add Spot trading to your DEX." trigger={<Button type="button" disabled={disabled} className="w-full">{label}<ArrowRight size={17} aria-hidden="true" /></Button>}>
          <InlinePromptCard compact eyebrow={eyebrow} title={title} description={description} helper={helper} prompt={prompt} onCopy={onCopy} instructionsLabel={instructionsLabel} disabled={disabled} />
        </BuildDexDialog>}
      {docsUrl ? <div className="flex w-full justify-center"><PromptDocsLink href={docsUrl}>View integration documentation</PromptDocsLink></div> : null}
      {children}
    </div>
  </section>;
}
