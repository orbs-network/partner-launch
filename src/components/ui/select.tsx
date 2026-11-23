import type { ComponentProps } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

function SelectTrigger({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn("flex min-h-11 items-center justify-between gap-2 rounded-xl border border-(--edge) bg-(--control-bg) px-3 text-sm text-(--text) transition-colors hover:border-(--selected-border) focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring) disabled:cursor-not-allowed disabled:opacity-50 [&>span]:truncate", className)}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild><ChevronDown size={16} className="shrink-0 text-(--muted)" aria-hidden="true" /></SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className={cn("z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) max-w-[calc(100vw_-_24px)] overflow-hidden rounded-[17px] border border-(--edge) bg-(--surface) p-1.5 text-(--text) shadow-[0_12px_35px_var(--dialog-shadow)]", className)}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="flex h-6 items-center justify-center text-(--muted)"><ChevronUp size={16} aria-hidden="true" /></SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex h-6 items-center justify-center text-(--muted)"><ChevronDown size={16} aria-hidden="true" /></SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn("relative flex min-h-11 cursor-pointer items-center rounded-[11px] py-2 pr-9 pl-3 text-[13px] wrap-anywhere outline-none select-none data-highlighted:bg-(--primary-soft) data-highlighted:text-(--link) data-[state=checked]:text-(--link) data-disabled:pointer-events-none data-disabled:opacity-50", className)}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-3 flex items-center"><Check size={16} aria-hidden="true" /></SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export { Select, SelectValue, SelectTrigger, SelectContent, SelectItem };
