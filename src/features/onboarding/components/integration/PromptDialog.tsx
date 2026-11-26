import { useId, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Copy, MessageSquareText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/** One responsive prompt dialog for onboarding, completion and workspace actions. */
export function PromptDialog({ prompt, onCopy, title, description, trigger, triggerLabel = "Integration prompt", disabled = false, children }: {
  prompt: string;
  onCopy: () => Promise<boolean>;
  title: string;
  description: string;
  trigger?: ReactElement;
  triggerLabel?: string;
  disabled?: boolean;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild aria-controls={id} onClick={event => { triggerRef.current = event.currentTarget; }}>
      {trigger ?? <Button type="button" disabled={disabled} className="w-full"><MessageSquareText size={18} aria-hidden="true" />{triggerLabel}</Button>}
    </DialogTrigger>
    <DialogContent id={id} showCloseButton={false} className="block max-h-[calc(100dvh-32px)] w-[580px] max-w-[calc(100vw-32px)] overflow-y-auto overscroll-contain rounded-[29px] border border-(--panel-border) bg-(--surface) p-[29px] text-(--text) shadow-[0_20px_90px_var(--dialog-shadow)] max-[720px]:px-[22px] max-[720px]:py-[25px]"
      onOpenAutoFocus={event => { event.preventDefault(); titleRef.current?.focus({ preventScroll: true }); promptRef.current?.setSelectionRange(0, 0); if (promptRef.current) promptRef.current.scrollTop = 0; }}
      onCloseAutoFocus={event => { event.preventDefault(); triggerRef.current?.focus(); }}>
      <DialogClose asChild><Button type="button" variant="ghost" size="icon" className="absolute top-3 right-3 size-11" aria-label="Close integration prompt"><X size={19} aria-hidden="true" /></Button></DialogClose>
      <div className="flex items-center gap-[13px] pr-10">
        <span className="flex size-[54px] shrink-0 items-center justify-center rounded-[19px] bg-(--primary-soft) text-(--link)" aria-hidden="true"><MessageSquareText size={24} /></span>
        <DialogTitle ref={titleRef} tabIndex={-1} className="text-[25px] font-medium tracking-[-0.8px] outline-none max-[720px]:text-[23px]">{title}</DialogTitle>
      </div>
      <DialogDescription className="mt-3 text-sm leading-[1.7] text-(--secondary-text)">{description}</DialogDescription>
      {children}
      <textarea ref={promptRef} aria-label="Integration prompt" value={prompt} readOnly spellCheck={false} rows={9} className="mt-5 block h-[clamp(220px,40dvh,360px)] w-full resize-y rounded-[14px] border border-(--panel-border) bg-(--control-bg) p-[15px] text-[13px] leading-[1.75] wrap-anywhere text-(--secondary-text) focus-visible:outline-none max-[720px]:text-base max-[720px]:leading-[1.6]" />
      <Button type="button" className="mt-2.5 w-full" onClick={() => { void onCopy(); }}><Copy size={17} aria-hidden="true" />Copy integration prompt</Button>
    </DialogContent>
  </Dialog>;
}
