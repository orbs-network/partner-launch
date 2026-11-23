import { cn } from "@/lib/utils";
import { SetupSummary, type SetupSummaryData } from "../SetupSummary";

type CompletionSummaryProps = SetupSummaryData & {
  className?: string;
};

export function CompletionSummary({ className, ...draft }: CompletionSummaryProps) {
  return <SetupSummary draft={draft} className={cn("mt-3", className)} />;
}
