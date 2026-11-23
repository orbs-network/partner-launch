import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/** Inline validation message shown under the field it describes. Renders nothing without a message. */
export function FieldError({ id, message, className }: { id: string; message?: string; className?: string }) {
  if (!message) return null;
  return (
    <p id={id} className={cn("mt-2 flex items-start gap-1.5 text-xs leading-[1.6] text-(--status-danger)", className)}>
      <CircleAlert size={14} className="mt-[2px] shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}
