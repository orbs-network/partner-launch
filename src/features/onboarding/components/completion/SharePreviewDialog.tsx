import type { ComponentProps } from "react";
import { Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreatorLaunchCard } from "./CreatorLaunchCard";

export function SharePreviewDialog(props: ComponentProps<typeof CreatorLaunchCard>) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button id="completion-sharing" type="button" variant="secondary" size="sm" className="h-11 w-full rounded-xl px-3 text-xs min-[560px]:w-auto">
          <Share2 size={16} aria-hidden="true" /> Share your launch
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-32px)] w-[600px] overflow-y-auto" showCloseButton={false}>
        <DialogClose asChild>
          <Button type="button" variant="ghost" size="icon" className="absolute top-3 right-3 size-11 max-[720px]:size-11" aria-label="Close launch announcement">
            <X size={18} aria-hidden="true" />
          </Button>
        </DialogClose>
        <DialogTitle className="pr-7 text-[23px]">Share your launch</DialogTitle>
        <DialogDescription className="mt-2 text-xs">A coming-soon card for your community.</DialogDescription>
        <div className="mt-5">
          <CreatorLaunchCard {...props} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
