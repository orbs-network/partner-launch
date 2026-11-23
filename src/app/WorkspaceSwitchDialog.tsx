import { useRef, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";

export function WorkspaceSwitchDialog({ open, onCancel, onDiscard, returnFocusRef }: {
  open: boolean;
  onCancel: () => void;
  onDiscard: () => boolean;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const discardedRef = useRef(false);
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
      <DialogContent onOpenAutoFocus={(event) => { event.preventDefault(); discardedRef.current = false; cancelRef.current?.focus(); }} onCloseAutoFocus={(event) => {
        event.preventDefault();
        if (discardedRef.current) return;
        const target = returnFocusRef.current?.isConnected ? returnFocusRef.current : document.querySelector<HTMLElement>("#main h1");
        target?.focus({ preventScroll: true });
      }}>
        <DialogTitle>Discard unsaved changes?</DialogTitle>
        <DialogDescription>Save your settings before leaving, or discard these edits to continue. Your saved setup stays unchanged.</DialogDescription>
        <DialogFooter className="mt-6">
          <Button ref={cancelRef} type="button" variant="secondary" onClick={onCancel}>Keep editing</Button>
          <Button type="button" onClick={() => { discardedRef.current = onDiscard(); }}>Discard changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
