import { useRef, type RefObject } from "react";
import { Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  returnFocusRef,
  intent = "reset",
  description,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  intent?: "reset" | "create-new";
  description?: string;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const creatingNew = intent === "create-new";
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current = returnFocusRef.current;
          cancelRef.current?.focus({ preventScroll: true });
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          // The completion trigger is removed after reset; leave Welcome's focus intact.
          triggerRef.current?.focus({ preventScroll: true });
        }}
      >
        <DialogClose asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 size-11 max-[720px]:size-11"
            aria-label={creatingNew ? "Close new setup confirmation" : "Close reset confirmation"}
          >
            <X size={19} aria-hidden="true" />
          </Button>
        </DialogClose>
        <div className="mb-5 flex size-[54px] items-center justify-center rounded-[19px] bg-(--primary-soft) text-(--link)">
          {creatingNew ? <Plus size={23} aria-hidden="true" /> : <RotateCcw size={23} aria-hidden="true" />}
        </div>
        <DialogTitle>{creatingNew ? "Create another setup?" : "Start over?"}</DialogTitle>
        <DialogDescription>
          {description ?? (creatingNew
            ? "Start a fresh setup for another DEX or integration."
            : "You’ll start with a fresh setup. This clears the details saved in this browser. Earlier payments and signed terms stay unchanged.")}
        </DialogDescription>
        <DialogFooter className="mt-[25px] [&_button]:min-h-[46px] [&_button]:px-4 [&_button]:text-[13px] max-[480px]:[&_button]:min-w-0 max-[480px]:[&_button]:flex-1 max-[480px]:[&_button]:px-3 max-[480px]:[&_button]:whitespace-normal">
          <DialogClose asChild>
            <Button
              type="button"
              ref={cancelRef}
              variant="secondary"
            >
              {creatingNew ? "Not now" : "Keep my progress"}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant={creatingNew ? "default" : "destructive"}
            onClick={onConfirm}
          >
            {creatingNew ? "Create another" : "Start over"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
