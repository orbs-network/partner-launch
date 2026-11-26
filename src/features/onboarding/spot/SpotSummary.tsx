import { generateSpotAppId } from "./app-id";
import { formatSpotFeePercent } from "./spot-fee";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SpotStep } from "./spot-setup";

export function SpotSummary({ appName, partnerId, contact, dexUrl, integrationMode, feesWallet, tradingFeeTenthsBps, onEdit }: {
  appName: string;
  partnerId?: string;
  contact?: string;
  dexUrl?: string;
  integrationMode?: "ui" | "existing";
  feesWallet: string;
  tradingFeeTenthsBps: number;
  onEdit?: (step: SpotStep, field?: string) => void;
}) {
  const rows = [
    { id: "app", label: "DEX name", value: appName },
    ...(onEdit && integrationMode === "existing" ? [{ id: "app" as const, key: "partnerId", label: "Partner ID", value: partnerId || generateSpotAppId(appName) }] : []),
    ...((dexUrl || (onEdit && integrationMode !== "existing")) ? [{ id: "url" as const, label: "DEX URL", value: dexUrl || "Not provided" }] : []),
    { id: "wallet", label: "Revenue wallet", value: feesWallet },
    { id: "wallet", key: "fee", label: "Platform fee", value: `${formatSpotFeePercent(tradingFeeTenthsBps)}%` },
    ...(contact || onEdit ? [{ id: "app" as const, key: "contact", label: "Contact", value: contact || "Not provided" }] : []),
  ] as const;
  return (
    <dl className="m-0 divide-y divide-(--edge) rounded-2xl border border-(--edge) bg-(--control-bg) px-4">
      {rows.map((row) => (
        <div key={"key" in row ? row.key : row.id} className="flex items-start justify-between gap-3 py-3.5">
          <div className="min-w-0">
            <dt className="text-xs text-(--muted)">{row.label}</dt>
            <dd className={`m-0 mt-1 text-sm leading-[1.7] text-(--text) [overflow-wrap:anywhere] ${row.label === "Revenue wallet" ? "font-mono" : ""}`}>{row.value}</dd>
          </div>
          {onEdit && !("key" in row && row.key === "partnerId") && (row.id !== "url" || integrationMode !== "existing") ? <Button variant="ghost" size="sm" type="button" className="shrink-0 text-xs text-(--link)" onClick={() => onEdit(row.id, "key" in row ? row.key === "fee" ? "spot-fee" : `spot-${row.key}` : undefined)} aria-label={`Edit ${row.label.toLowerCase()}`}><Pencil size={13} aria-hidden="true" /> Edit</Button> : null}
        </div>
      ))}
    </dl>
  );
}
