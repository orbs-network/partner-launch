import type { ReactElement, ReactNode } from "react";
import { LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function BuildDexDialog({ children, disabled = false, trigger, title = "Build your DEX", description = "Use AI to customize your trading platform. No coding required." }: { children: ReactNode; disabled?: boolean; trigger?: ReactElement; title?: string; description?: string }) {
  return <Dialog>
    <DialogTrigger asChild>{trigger ?? <Button type="button" disabled={disabled} className="w-full"><LayoutTemplate size={17} aria-hidden="true" />Build your DEX</Button>}</DialogTrigger>
    <DialogContent className="max-h-[calc(100dvh-32px)] w-[580px] max-w-[calc(100vw-32px)] overflow-y-auto">
      <DialogTitle className="pr-10 text-[23px] font-semibold">{title}</DialogTitle>
      <DialogDescription className="mt-2 text-sm leading-relaxed text-(--secondary-text)">{description}</DialogDescription>
      <div className="mt-5">{children}</div>
    </DialogContent>
  </Dialog>;
}
