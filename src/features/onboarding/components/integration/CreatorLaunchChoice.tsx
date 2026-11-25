import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";

export function CreatorLaunchChoice({ checked, onCheckedChange, disabled = false, description = "The copied prompt asks your coding agent to choose missing branding, show you the design, and publish it without another design approval." }: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  description?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-[13px] leading-[1.6] text-(--text)">
      <Checkbox id={id} checked={checked} disabled={disabled} onCheckedChange={value => onCheckedChange(value === true)} aria-labelledby={`${id}-label`} aria-describedby={`${id}-description`} className="mt-0.5" />
      <span>
        <span id={`${id}-label`} className="font-medium">Let the AI choose the design for me</span>
        <span id={`${id}-description`} className="mt-1 block text-xs leading-[1.65] text-(--secondary-text)">{description}</span>
      </span>
    </label>
  );
}
