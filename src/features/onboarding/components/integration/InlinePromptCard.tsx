import { useId, useState, type ReactNode } from "react";
import { ChevronDown, Copy, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shared completion card, with a selectable fallback if clipboard access fails. */
export function InlinePromptCard({ eyebrow, title, description, helper, children, prompt, onCopy, instructionsLabel = "Full launch instructions", disabled = false }: {
  eyebrow: string;
  title: string;
  description: ReactNode;
  helper: ReactNode;
  children?: ReactNode;
  prompt: string;
  onCopy: () => Promise<boolean>;
  instructionsLabel?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  async function copyInstructions() {
    if (!await onCopy()) setOpen(true);
  }
  return <section className="mt-6 rounded-[22px] border border-(--edge) bg-(--control-bg) p-5 max-[480px]:p-4" aria-labelledby={titleId}>
    <div className="flex items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-(--primary-soft) text-(--link)" aria-hidden="true"><MessageSquareText size={21} /></span>
      <div><p className="text-xs font-medium text-(--link)">{eyebrow}</p><h2 id={titleId} className="mt-0.5 text-base font-semibold">{title}</h2></div>
    </div>
    <p className="mt-4 text-sm leading-[1.7] text-(--secondary-text)">{description}</p>
    <p className="mt-2 text-[13px] leading-[1.7] text-(--muted)">{helper}</p>
    {children}
    <details className="group mt-2" open={open} onToggle={event => setOpen(event.currentTarget.open)}>
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg text-[13px] font-medium text-(--link) hover:text-(--link-hover) focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--focus-ring) [&::-webkit-details-marker]:hidden">
        {instructionsLabel} <ChevronDown size={16} aria-hidden="true" className="shrink-0 group-open:rotate-180" />
      </summary>
      <textarea className="mt-2 block h-[clamp(160px,30dvh,260px)] w-full resize-y rounded-[14px] border border-(--panel-border) bg-(--surface) p-[15px] text-[13px] leading-[1.75] wrap-anywhere text-(--secondary-text) focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--focus-ring) max-[720px]:text-base" aria-label="Integration prompt" value={prompt} readOnly spellCheck={false} rows={9} />
    </details>
    <Button type="button" className="mt-3 w-full" disabled={disabled} onClick={() => void copyInstructions()}><Copy size={17} aria-hidden="true" />Copy integration prompt</Button>
  </section>;
}
