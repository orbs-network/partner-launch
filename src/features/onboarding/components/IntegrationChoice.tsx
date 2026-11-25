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
  const choices = product === "Perps" ? [
    { value: "ui" as const, title: "Use a ready-made UI", description: "Launch with a complete perpetual trading interface and customize it with your brand.", detail: "Best for a fast, branded launch", Icon: LayoutTemplate },
    { value: "existing" as const, title: "Integrate the trading API", description: "Run algorithmic strategies or connect perpetual trading to your wallet, bot, or community.", detail: "Best for algo traders, wallets, and trading communities", Icon: Code2 },
  ] : [
    { value: "ui" as const, title: "Use a ready-made UI", description: "Launch with a complete Spot trading interface and customize it with your brand.", detail: "Best for a fast, branded launch", Icon: LayoutTemplate },
    { value: "existing" as const, title: "Add Spot to my DEX", description: "Connect Spot trading to your existing DEX with help from your developer or coding agent.", detail: "Best if you already have a DEX", Icon: Code2 },
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
