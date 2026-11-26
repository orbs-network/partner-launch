import { useId, type ReactNode } from "react";
import { MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromptDocsLink } from "./PromptDocsLink";
import { PromptDialog } from "./PromptDialog";

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
  const label = launch ? "Launch your DEX" : "API integration prompt";
  return <section className={`${compact ? "mt-0" : "mt-6"} rounded-[22px] border border-(--edge) bg-(--control-bg) p-5 max-[480px]:p-4`} aria-labelledby={titleId}>
    <div className="flex items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-(--primary-soft) text-(--link)" aria-hidden="true"><MessageSquareText size={21} /></span>
      <div><p className="text-xs font-medium text-(--link)">{eyebrow}</p><h2 id={titleId} className="mt-0.5 text-base font-semibold">{title}</h2></div>
    </div>
    <p className="mt-4 text-sm leading-[1.7] text-(--secondary-text)">{description}</p>
    <p className="mt-2 text-[13px] leading-[1.7] text-(--muted)">{helper}</p>
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      <PromptDialog prompt={prompt} onCopy={onCopy} title={launch ? "Build your DEX" : "Your integration prompt"} description="Copy this prompt for your developer or a coding assistant."
        trigger={<Button type="button" disabled={disabled} size={compact ? "sm" : "default"} className={compact ? "min-h-11 rounded-xl px-5 text-sm has-[>svg]:px-5" : "w-full"}><MessageSquareText size={17} aria-hidden="true" />{label}</Button>} />
      {docsUrl ? <PromptDocsLink href={docsUrl}>Spot integration docs</PromptDocsLink> : null}
      {children}
    </div>
  </section>;
}
