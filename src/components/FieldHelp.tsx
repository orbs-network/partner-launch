import { useEffect, useRef, useState, type ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import { Popover } from "radix-ui";

/** Field guidance opens on hover, keyboard activation, or tap. */
export function FieldHelp({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pinned = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  function cancelClose() { clearTimeout(timer.current); }
  function closeAfterHover() {
    cancelClose();
    timer.current = setTimeout(() => { if (!pinned.current) setOpen(false); }, 180);
  }
  useEffect(() => () => clearTimeout(timer.current), []);
  return <Popover.Root open={open} onOpenChange={next => { pinned.current = next; setOpen(next); }}>
    <Popover.Trigger asChild>
      <button type="button" aria-label={`About ${label}`} className="-my-3 inline-flex size-11 shrink-0 appearance-none items-center justify-start rounded-full border-0 bg-transparent p-0 pl-1 text-(--muted) hover:text-(--link) focus-visible:outline-none focus-visible:[&>svg]:rounded-full focus-visible:[&>svg]:outline-2 focus-visible:[&>svg]:outline-offset-2 focus-visible:[&>svg]:outline-(--focus-ring)"
        onPointerEnter={event => { if (event.pointerType === "mouse") { cancelClose(); setOpen(true); } }}
        onPointerLeave={event => { if (event.pointerType === "mouse") closeAfterHover(); }}
        onClick={event => { event.preventDefault(); pinned.current = !pinned.current; setOpen(pinned.current); }}>
        <CircleHelp size={16} aria-hidden="true" />
      </button>
    </Popover.Trigger>
    <Popover.Portal>
      <Popover.Content aria-label={`${label} help`} side="top" align="start" sideOffset={6} collisionPadding={16}
        onOpenAutoFocus={event => event.preventDefault()}
        onCloseAutoFocus={event => event.preventDefault()}
        onPointerEnter={cancelClose} onPointerLeave={event => { if (event.pointerType === "mouse") closeAfterHover(); }}
        className="z-50 w-[280px] max-w-[calc(100vw-32px)] rounded-xl border border-(--edge) bg-(--surface) px-4 py-3 text-[13px] leading-relaxed text-(--text) shadow-[0_12px_35px_var(--dialog-shadow)] outline-none">
        {children}
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>;
}
