import { Code2, LayoutTemplate } from "lucide-react";
import { FieldError } from "@/components/ui/field-error";

export type IntegrationChoiceValue = "ui" | "existing";
export function IntegrationChoice({ product, selected, onSelect, error, disabled }: {
  product: "Spot" | "Perps";
  selected?: IntegrationChoiceValue | null;
  onSelect: (value: IntegrationChoiceValue) => void;
  error?: string;
  disabled: boolean;
}) {
  const choices = [
    { value: "ui" as const, title: "A complete trading app", description: "Start with a ready-made trading interface, then make it your own with your branding.", detail: "Best if you need a trading app", Icon: LayoutTemplate },
    { value: "existing" as const, title: "Add trading to my app", description: `Keep your existing app and let your developer or AI assistant connect ${product} behind the scenes.`, detail: "Best if you already have an app", Icon: Code2 },
  ];
  return <fieldset className="m-0 grid min-w-0 gap-3 border-0 p-0" aria-describedby={error ? "integration-choice-error" : undefined}>
    <legend className="sr-only">Choose how to add {product}</legend>
    {choices.map(({ value, title, description, detail, Icon }) => <label key={value} className={`relative flex min-h-11 cursor-pointer items-start gap-4 rounded-[20px] border p-5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-(--focus-ring) max-[480px]:gap-3 max-[480px]:p-4 ${error ? "border-(--status-danger) bg-(--control-bg)" : selected === value ? "border-(--selected-border) bg-(--selected-bg)" : "border-(--edge) bg-(--control-bg) hover:bg-(--control-hover)"}`}>
      <input type="radio" name="integrationMode" value={value} checked={selected === value} onChange={() => onSelect(value)} disabled={disabled} aria-invalid={!!error} aria-describedby={error ? "integration-choice-error" : undefined} className="sr-only" />
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-(--primary-soft) text-(--link)"><Icon size={21} aria-hidden="true" /></span>
      <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold">{title}</span><span className="mt-1 block text-sm leading-relaxed text-(--secondary-text)">{description}</span><span className="mt-2 block text-xs font-medium text-(--link)">{detail}</span></span>
      <span aria-hidden="true" className={`mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border ${selected === value ? "border-(--link)" : "border-(--muted)"}`}><span className={`size-2.5 rounded-full ${selected === value ? "bg-(--link)" : "bg-transparent"}`} /></span>
    </label>)}
    <FieldError id="integration-choice-error" message={error} />
  </fieldset>;
}
