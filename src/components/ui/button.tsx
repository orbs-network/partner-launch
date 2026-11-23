import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Slot } from "radix-ui";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-[9px] rounded-[19px] border border-transparent text-[15px] font-medium leading-[1.4] whitespace-nowrap transition-[background-color,border-color,box-shadow] duration-150 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--focus-ring) disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:border-(--error-border) [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-0 bg-primary text-white hover:bg-(--primary-hover) hover:shadow-[0_3px_12px_#3346f21a] disabled:bg-(--disabled-bg) disabled:text-(--disabled-text) disabled:transition-none",
        destructive:
          "border-0 bg-(--danger-button) text-white hover:bg-(--danger-button-hover)",
        outline:
          "border-(--panel-border) bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
        secondary:
          "border-0 bg-(--button-secondary) text-(--link) hover:bg-(--control-hover) disabled:bg-(--disabled-bg) disabled:text-(--disabled-text)",
        ghost:
          "bg-transparent text-(--muted) hover:bg-(--control-hover) hover:text-(--link) disabled:text-(--disabled-text)",
        link: "border-0 bg-transparent text-(--link) underline-offset-4 hover:text-(--link-hover) hover:underline",
      },
      size: {
        default: "h-auto min-h-[51px] px-5 py-3.5 max-[720px]:min-h-[50px] max-[720px]:px-[17px] max-[720px]:py-[13px] max-[720px]:text-sm",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-[39px] min-h-0 rounded-full border-0 p-0 max-[720px]:size-[35px]",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    compoundVariants: [{ variant: "link", size: "default", className: "min-h-0 px-0 py-0 text-[13px] leading-[1.7] max-[720px]:min-h-0 max-[720px]:px-0 max-[720px]:py-0 max-[720px]:text-xs" }],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button };
