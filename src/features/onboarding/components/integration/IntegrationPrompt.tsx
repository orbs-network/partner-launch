import { useId, useRef, useState, type ReactElement, type ReactNode } from "react";
import { ArrowRight, Check, ChevronDown, Copy, MessageSquareText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useIntegrationPrompt, type PromptSetup } from "../../hooks/useIntegrationPrompt";
import { CreatorLaunchChoice } from "./CreatorLaunchChoice";

export function IntegrationPrompt({ launchPath, draft, triggerLabel, trigger, children }: {
  launchPath?: "creator" | "api" | null;
  draft?: PromptSetup;
  triggerLabel?: string;
  trigger?: ReactElement;
  children?: ReactNode;
}) {
  const creator = (launchPath ?? draft?.launchPath) !== "api";
  const [open, setOpen] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const dialogId = useId();
  const { prompt, copied, copyPrompt, chooseBranding, setChooseBranding } =
    useIntegrationPrompt(draft, launchPath);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);
  function showInstructions(button: HTMLButtonElement, expand = false) {
    returnFocusRef.current = button;
    setInstructionsOpen(expand);
    setOpen(true);
  }
  async function copyInstructions() {
    if (!await copyPrompt()) setInstructionsOpen(true);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild aria-controls={dialogId} onClick={event => {
        returnFocusRef.current = event.currentTarget;
        setInstructionsOpen(false);
      }}>{trigger}</DialogTrigger> : <div className="mt-[18px]">
        <Button
          type="button"
          variant={creator ? "default" : "secondary"}
          className="hidden w-full min-[721px]:inline-flex"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={dialogId}
          onClick={event => showInstructions(event.currentTarget)}
        >
          <MessageSquareText size={18} aria-hidden="true" />
          {triggerLabel ?? (creator ? "Launch your DEX in 2 minutes" : "Integration prompt")}
          <ArrowRight className="ml-auto" size={16} aria-hidden="true" />
        </Button>
        <Button type="button" variant={creator ? "default" : "secondary"} className="w-full min-[721px]:hidden" onClick={async event => { const button = event.currentTarget; if (!await copyPrompt()) showInstructions(button, true); }}>
          {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
          {copied ? creator ? "Instructions copied" : "Prompt copied" : creator ? "Copy launch instructions" : "Copy integration prompt"}
        </Button>
        {!creator ? <p className="mt-2 hidden text-xs leading-[1.65] text-(--muted) min-[721px]:block">Give the prompt to your team, or use a desktop coding assistant.</p> : null}
        <p className="mt-2 text-xs leading-[1.65] text-(--muted) min-[721px]:hidden">{creator ? "Build on a computer with Codex or Claude and your hosting account. Copy these instructions now, then paste them into your desktop assistant." : "Copy this prompt for your team or a coding assistant on a computer."}</p>
        <Button type="button" variant="link" size="sm" className="mt-1 min-h-11 px-0 text-xs min-[721px]:hidden" aria-haspopup="dialog" aria-expanded={open} aria-controls={dialogId} onClick={event => showInstructions(event.currentTarget)}>{creator ? "View instructions" : "View prompt"}</Button>
      </div>}
      <DialogContent
        id={dialogId}
        className="block max-h-[calc(100dvh-32px)] w-[580px] max-w-[calc(100vw-32px)] overflow-y-auto overscroll-contain rounded-[29px] border border-(--panel-border) bg-(--surface) p-[29px] text-(--text) shadow-[0_20px_90px_var(--dialog-shadow)] max-[720px]:px-[22px] max-[720px]:py-[25px] max-[480px]:py-[25px]"
        showCloseButton={false}
        onCloseAutoFocus={event => { event.preventDefault(); returnFocusRef.current?.focus(); }}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          // Announce the dialog heading without highlighting the prompt on open.
          titleRef.current?.focus({ preventScroll: true });
          promptRef.current?.setSelectionRange(0, 0);
          if (promptRef.current) promptRef.current.scrollTop = 0;
        }}
      >
        <DialogClose asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 size-[39px] min-h-0 shrink-0 rounded-full border-0 bg-transparent p-0 text-(--muted) hover:bg-(--control-hover) hover:text-(--link) max-[720px]:size-[35px] max-[720px]:min-h-0 max-[720px]:p-0"
            aria-label="Close integration prompt"
          >
            <X size={19} aria-hidden="true" />
          </Button>
        </DialogClose>
        <div className="flex items-center gap-[13px] pr-3">
          <span className="flex size-[54px] shrink-0 items-center justify-center rounded-[19px] bg-(--primary-soft) text-(--link)" aria-hidden="true"><MessageSquareText size={24} /></span>
          <div>
            <span className="mb-2 inline-flex items-center gap-1 rounded-[7px] bg-(--tint-bg) px-1.5 py-1 text-[10px] whitespace-nowrap text-(--link)">{creator ? "Official app" : "Starter"}</span>
            <DialogTitle ref={titleRef} tabIndex={-1} className="pr-3 outline-none text-[25px] font-medium tracking-[-0.8px] max-[720px]:text-[23px]">{creator ? "Build your app" : "Your integration prompt"}</DialogTitle>
          </div>
        </div>
        <DialogDescription className="mt-[13px] text-[14px] leading-[1.7] text-(--secondary-text) max-[720px]:text-[12px]">
          {creator ? "Add your branding, review the app and publish it. Trading requires partner activation." : "Copy this prompt for your team or a coding assistant on a computer."}
        </DialogDescription>
        {creator ? <p className="mt-2 text-xs leading-[1.65] text-(--muted)">Copy the launch instructions below and paste them into a coding agent such as Codex or Claude with folder access on your computer. You’ll sign in to your own hosting account.</p> : null}
        {creator ? <CreatorLaunchChoice checked={chooseBranding} onCheckedChange={setChooseBranding} /> : null}
        {children}
        {creator ? (
          <details className="group mt-3" open={instructionsOpen} onToggle={event => setInstructionsOpen(event.currentTarget.open)}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg text-[13px] text-(--link) hover:text-(--link-hover) focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--focus-ring) [&::-webkit-details-marker]:hidden">
              Full launch instructions
              <ChevronDown size={16} aria-hidden="true" className="shrink-0 group-open:rotate-180" />
            </summary>
            <textarea
              ref={promptRef}
              className="mt-2 block h-[clamp(160px,30dvh,260px)] w-full resize-y rounded-[14px] border border-(--panel-border) bg-(--control-bg) p-[15px] text-[13px] leading-[1.75] wrap-anywhere text-(--secondary-text) focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--focus-ring) max-[720px]:text-[16px] max-[720px]:leading-[1.6]"
              aria-label="Launch prompt"
              value={prompt}
              readOnly
              spellCheck={false}
              rows={9}
            />
          </details>
        ) : <textarea
          ref={promptRef}
          className="mt-5 block h-[clamp(160px,30dvh,260px)] w-full resize-y rounded-[14px] border border-(--panel-border) bg-(--control-bg) p-[15px] text-[13px] leading-[1.75] wrap-anywhere text-(--secondary-text) focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-(--focus-ring) max-[720px]:text-[16px] max-[720px]:leading-[1.6]"
          aria-label={creator ? "Launch prompt" : "Integration prompt"}
          value={prompt}
          readOnly
          spellCheck={false}
          rows={9}
        />}
        <Button
          type="button"
          className="mt-2.5 w-full"
          onClick={copyInstructions}
        >
          {copied ? (
            <Check size={17} aria-hidden="true" />
          ) : (
            <Copy size={17} aria-hidden="true" />
          )}
          {copied ? creator ? "Instructions copied" : "Prompt copied" : creator ? "Copy launch instructions" : "Copy integration prompt"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
