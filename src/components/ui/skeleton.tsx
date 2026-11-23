import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} data-slot="skeleton" aria-hidden="true" className={cn("animate-pulse rounded-lg bg-(--progress-track) motion-reduce:animate-none", className)} />;
}
