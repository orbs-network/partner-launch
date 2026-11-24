import * as React from "react";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePrimitiveRef } from "@/hooks/usePrimitiveRef";
import { Drawer, DrawerTrigger, DrawerPortal, DrawerClose, DrawerOverlay, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";

const DialogMode = React.createContext(false);

function Dialog({
  open,
  defaultOpen = false,
  onOpenChange,
  dismissible = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root> & { dismissible?: boolean }) {
  const viewportMobile = useIsMobile();
  const [mobile, setMobile] = React.useState(viewportMobile);
  // Keep an in-flight action mounted if the viewport changes while dismissal is locked.
  if (dismissible && mobile !== viewportMobile) setMobile(viewportMobile);
  const nested = React.useContext(DialogMode);
  const [localOpen, setLocalOpen] = React.useState(defaultOpen);
  const isOpen = open ?? localOpen;
  const changeOpen = (next: boolean) => {
    if (!next && !dismissible) return;
    if (open === undefined) setLocalOpen(next);
    onOpenChange?.(next);
  };
  return <DialogMode value={mobile}>
    {mobile ? <Drawer nested={nested} open={isOpen} onOpenChange={changeOpen} dismissible={dismissible} shouldScaleBackground={false} autoFocus {...props} />
      : <DialogPrimitive.Root data-slot="dialog" open={isOpen} onOpenChange={changeOpen} {...props} />}
  </DialogMode>;
}

function DialogTrigger({
  ref,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  const primitiveRef = usePrimitiveRef(ref);
  const Trigger = React.useContext(DialogMode) ? DrawerTrigger : DialogPrimitive.Trigger;
  return <Trigger ref={primitiveRef} data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  const Portal = React.useContext(DialogMode) ? DrawerPortal : DialogPrimitive.Portal;
  return <Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ref,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  const primitiveRef = usePrimitiveRef(ref);
  const Close = React.useContext(DialogMode) ? DrawerClose : DialogPrimitive.Close;
  return <Close ref={primitiveRef} data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  const primitiveRef = usePrimitiveRef(ref);
  if (React.useContext(DialogMode)) return <DrawerOverlay ref={primitiveRef} className={className} {...props} />;
  return (
    <DialogPrimitive.Overlay
      ref={primitiveRef}
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-(--overlay) backdrop-blur-[5px] data-[state=closed]:animate-dialog-overlay-out data-[state=open]:animate-dialog-overlay-in",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  ref,
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  const primitiveRef = usePrimitiveRef(ref);
  const mobile = React.useContext(DialogMode);
  const closeButton = showCloseButton ? (
    <DialogClose asChild>
      <Button type="button" variant="ghost" size="icon" className="absolute top-3 right-3 size-11 max-[720px]:size-11" aria-label="Close">
        <XIcon size={19} aria-hidden="true" />
      </Button>
    </DialogClose>
  ) : null;
  if (mobile) return <DrawerContent ref={primitiveRef} bodyClassName={className} {...props} onOpenAutoFocus={event => {
    props.onOpenAutoFocus?.(event);
    if (!event.defaultPrevented) {
      event.preventDefault();
      primitiveRef.current?.focus({ preventScroll: true });
    }
  }}>{children}{closeButton}</DrawerContent>;
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={primitiveRef}
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 block w-[430px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 overscroll-contain rounded-[29px] border border-(--panel-border) bg-(--surface) p-[29px] text-(--text) shadow-[0_20px_90px_var(--dialog-shadow)] outline-none data-[state=closed]:animate-dialog-content-out data-[state=open]:animate-dialog-content-in max-[480px]:px-[22px] max-[480px]:py-[26px]",
          className,
        )}
        {...props}
      >
        {children}
        {closeButton}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-row justify-end gap-2.5 max-[480px]:flex-wrap",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogClose asChild>
          <Button variant="outline">Close</Button>
        </DialogClose>
      )}
    </div>
  );
}

function DialogTitle({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  const primitiveRef = usePrimitiveRef(ref);
  const Title = React.useContext(DialogMode) ? DrawerTitle : DialogPrimitive.Title;
  return (
    <Title
      ref={primitiveRef}
      data-slot="dialog-title"
      className={cn("text-[25px] font-medium tracking-[-0.8px]", className)}
      {...props}
    />
  );
}

function DialogDescription({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  const primitiveRef = usePrimitiveRef(ref);
  const Description = React.useContext(DialogMode) ? DrawerDescription : DialogPrimitive.Description;
  return (
    <Description
      ref={primitiveRef}
      data-slot="dialog-description"
      className={cn("mt-[13px] text-sm leading-[1.7] text-(--secondary-text)", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
