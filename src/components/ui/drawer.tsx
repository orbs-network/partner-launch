import type { ComponentProps } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";

// shadcn/ui's Radix drawer, styled with the Portal's shared surface tokens.
const Drawer = DrawerPrimitive.Root;
const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerPortal = DrawerPrimitive.Portal;
const DrawerClose = DrawerPrimitive.Close;
const DrawerTitle = DrawerPrimitive.Title;
const DrawerDescription = DrawerPrimitive.Description;

function DrawerOverlay({ className, ...props }: ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return <DrawerPrimitive.Overlay data-slot="drawer-overlay" className={cn("fixed inset-0 z-50 bg-(--overlay) backdrop-blur-[5px]", className)} {...props} />;
}

function DrawerContent({ className, bodyClassName, children, ...props }: ComponentProps<typeof DrawerPrimitive.Content> & { bodyClassName?: string }) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content data-slot="drawer-content" className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex h-auto max-h-[calc(100dvh-24px)] w-full flex-col overscroll-contain rounded-t-[29px] border border-b-0 border-(--panel-border) bg-(--surface) text-(--text) shadow-[0_20px_90px_var(--dialog-shadow)] outline-none",
        className,
      )} {...props}>
        <DrawerPrimitive.Handle preventCycle aria-hidden="true" className="mt-4 shrink-0 bg-(--edge)!" />
        <div data-slot="drawer-body" data-vaul-no-drag="" className={cn(
          "min-h-0 overflow-y-auto overscroll-contain p-[22px]",
          bodyClassName,
          "relative min-h-0 w-full max-w-none max-h-none rounded-none border-0 bg-transparent shadow-none pb-[max(22px,env(safe-area-inset-bottom))]! [&>[data-slot=dialog-close]]:min-h-11 [&>[data-slot=dialog-close]]:min-w-11",
        )}>{children}</div>
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="drawer-header" className={cn("flex flex-col gap-2", className)} {...props} />;
}

function DrawerFooter({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="drawer-footer" className={cn("mt-auto flex flex-col gap-2", className)} {...props} />;
}

export { Drawer, DrawerTrigger, DrawerPortal, DrawerClose, DrawerOverlay, DrawerContent, DrawerTitle, DrawerDescription, DrawerHeader, DrawerFooter };
