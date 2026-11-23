import type { Ref } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StartOverButton({ ref, onClick, disabled }: {
  ref?: Ref<HTMLButtonElement>;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      size="sm"
      className="h-11 shrink-0 gap-1.5 rounded-[12px] border-0 px-3 py-2 text-[13px] whitespace-nowrap text-(--muted) hover:enabled:text-(--status-danger) disabled:text-(--disabled-text) has-[>svg]:px-3"
      onClick={onClick}
      disabled={disabled}
    >
      <RotateCcw size={13} aria-hidden="true" />
      Start over
    </Button>
  );
}
