import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PendingRequest } from "./request-record";

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

/** Submitted → Approved → Live, from the stored review status and the live trading/configuration check. */
export function SetupTimeline({ request, approved, live }: { request: PendingRequest; approved: boolean; live: boolean }) {
  const steps = [
    { label: "Submitted", done: true, detail: dateFormat.format(new Date(request.savedAt)) },
    { label: "Approved", done: approved || live, detail: approved || live ? "By the Orbs team" : "Usually within 48 hours" },
    { label: request.kind === "perps" ? "Trading live" : "Live", done: live, detail: live ? "Enabled" : "After approval" },
  ];
  const current = steps.findIndex(step => !step.done);
  return (
    <ol className="m-0 mb-4 grid list-none grid-cols-3 gap-2 p-0" aria-label="Setup progress">
      {steps.map((step, index) => (
        <li key={step.label} aria-current={index === current ? "step" : undefined} className="min-w-0">
          <span className={cn("block h-1 rounded-full", step.done ? "bg-(--link)" : index === current ? "bg-(--link)/35" : "bg-(--edge)")} aria-hidden="true" />
          <span className={cn("mt-2 flex items-center gap-1 text-[13px] font-medium", step.done ? "text-(--text)" : "text-(--muted)")}>
            {step.done ? <Check size={13} className="shrink-0 text-(--link)" aria-hidden="true" /> : null}
            <span className="truncate">{step.label}</span>
            <span className="sr-only">{step.done ? " (done)" : index === current ? " (current)" : " (upcoming)"}</span>
          </span>
          <span className="block truncate text-xs text-(--muted)">{step.detail}</span>
        </li>
      ))}
    </ol>
  );
}
