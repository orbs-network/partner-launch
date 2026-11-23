import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-[14px] border border-(--panel-border) bg-(--control-bg) px-3.5 py-3 text-base text-foreground outline-none transition-colors duration-150 placeholder:text-sm placeholder:text-muted-foreground hover:enabled:not-aria-invalid:border-(--focus-ring) focus:not-aria-invalid:border-(--focus-ring) focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-(--status-danger)",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
