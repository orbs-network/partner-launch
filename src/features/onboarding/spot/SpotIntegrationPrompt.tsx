import { useRef } from "react";
import { ArrowRight, Check, Code2, Copy, MessageSquareText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePromptClipboard } from "../hooks/usePromptClipboard";
import { createSpotIntegrationPrompt, type SpotIntegrationDetails } from "./spot-integration-prompt";

export function SpotIntegrationPrompt({ setup, disabled = false, compact = false }: { setup: SpotIntegrationDetails; disabled?: boolean; compact?: boolean }) {
  const prompt = createSpotIntegrationPrompt(setup);
  const isApp = setup.integrationMode === "ui";
  const { copied, copyPrompt } = usePromptClipboard(prompt, "Prompt copied", "spot-integration-prompt-copy");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button ref={triggerRef} type="button" size={compact ? "sm" : "default"} className={compact ? "min-h-11 gap-2 rounded-xl px-4 text-sm" : "w-full min-w-0 whitespace-normal text-left"} disabled={disabled}>
          <Code2 size={compact ? 16 : 18} aria-hidden="true" /> Integration prompt {!compact && <ArrowRight size={16} className="ml-auto" aria-hidden="true" />}
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="max-h-[calc(100dvh-32px)] w-[580px] overflow-y-auto overscroll-contain" onOpenAutoFocus={event => {
        event.preventDefault(); titleRef.current?.focus({ preventScroll: true });
      }} onCloseAutoFocus={event => { event.preventDefault(); triggerRef.current?.focus({ preventScroll: true }); }}>
        <DialogClose asChild>
          <Button type="button" variant="ghost" size="icon" className="absolute top-3 right-3 size-11 max-[720px]:size-11" aria-label="Close Spot integration prompt">
            <X size={19} aria-hidden="true" />
          </Button>
        </DialogClose>
        <div className="flex items-center gap-3 pr-10">
          <span className="flex size-[54px] shrink-0 items-center justify-center rounded-[19px] bg-(--primary-soft) text-(--link)" aria-hidden="true"><MessageSquareText size={24} /></span>
          <DialogTitle ref={titleRef} tabIndex={-1} className="text-[23px] outline-none">{isApp ? "Build your Spot app" : "Your Spot integration prompt"}</DialogTitle>
        </div>
        <DialogDescription>{isApp ? "Share this prompt with a coding assistant to customize the official Spot app while your setup is reviewed." : "Copy this prompt for your team or a coding assistant. You can start integrating while your setup is reviewed."}</DialogDescription>
        <textarea aria-label="Spot integration prompt" value={prompt} readOnly spellCheck={false} rows={9}
          className="mt-5 block h-[clamp(160px,30dvh,260px)] w-full resize-y rounded-[14px] border border-(--panel-border) bg-(--control-bg) p-[15px] text-[13px] leading-[1.75] wrap-anywhere text-(--secondary-text) focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--focus-ring) max-[720px]:text-base max-[720px]:leading-[1.6]" />
        <Button type="button" className="mt-3 w-full" onClick={() => { void copyPrompt(); }}>
          {copied ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
          {copied ? "Prompt copied" : "Copy integration prompt"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
