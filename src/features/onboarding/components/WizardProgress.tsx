import { Button } from "@/components/ui/button";
import type { StepProgress } from "../onboarding-steps";

export function WizardProgress({
  steps,
  step,
  onNavigate,
}: {
  steps: StepProgress[];
  step: number;
  onNavigate: (step: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 px-8 pt-[23px] max-[720px]:gap-x-3.5 max-[720px]:px-[21px] max-[720px]:pt-[10px] max-[370px]:gap-x-1 max-[370px]:px-2">
      <nav className="min-w-0" aria-label="Setup steps">
        <ol className="m-0 flex list-none gap-1.5 p-0 max-[720px]:gap-[3px] max-[370px]:gap-[2px]">
          {steps.map((item, index) => (
            <li
              key={item.name}
            >
              <Button
                variant="ghost"
                size="icon"
                className="size-11 min-h-0 rounded-[9px] border-0 bg-transparent p-0 hover:enabled:bg-transparent max-[720px]:size-11 [&:hover:enabled>span]:bg-(--progress-hover)"
                type="button"
                aria-label={item.name}
                title={item.name}
                disabled={item.disabled}
                onClick={() => onNavigate(item.target ?? index)}
                aria-current={item.active ? "step" : undefined}
              >
                <span className={`block h-1.5 w-[29px] rounded-[10px] max-[720px]:w-[25px] max-[370px]:w-[22px] ${item.active ? "bg-(--primary)" : item.done ? "bg-(--progress-done)" : "bg-(--progress-track)"}`} />
              </Button>
            </li>
          ))}
        </ol>
      </nav>
      <span className="rounded-[20px] bg-(--soft) px-2.5 py-1.5 text-[13px] whitespace-nowrap text-(--muted) tabular-nums max-[479px]:sr-only">
        {step + 1} of {steps.length}
      </span>
    </div>
  );
}
