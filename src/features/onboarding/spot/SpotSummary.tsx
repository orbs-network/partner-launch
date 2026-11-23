import { Button } from "@/components/ui/button";
import type { SpotStep } from "./spot-setup";

export function SpotSummary({ appName, dexUrl, feesWallet, onEdit }: {
  appName: string;
  dexUrl?: string;
  feesWallet: string;
  onEdit?: (step: SpotStep) => void;
}) {
  const rows = [
    { id: "app", label: "App name", value: appName },
    ...(dexUrl || onEdit ? [{ id: "url" as const, label: "DEX URL", value: dexUrl || "Not provided" }] : []),
    { id: "wallet", label: "Fees wallet", value: feesWallet },
  ] as const;
  return (
    <dl className="m-0 divide-y divide-(--edge) rounded-2xl border border-(--edge) bg-(--control-bg) px-4">
      {rows.map((row) => (
        <div key={row.id} className="flex items-start justify-between gap-3 py-3.5">
          <div className="min-w-0">
            <dt className="text-xs text-(--muted)">{row.label}</dt>
            <dd className={`m-0 mt-1 text-sm leading-[1.7] text-(--text) [overflow-wrap:anywhere] ${row.id === "wallet" ? "font-mono" : ""}`}>{row.value}</dd>
          </div>
          {onEdit ? <Button variant="ghost" size="sm" type="button" className="shrink-0 text-xs text-(--link)" onClick={() => onEdit(row.id)} aria-label={`Edit ${row.label.toLowerCase()}`}>Edit</Button> : null}
        </div>
      ))}
    </dl>
  );
}
