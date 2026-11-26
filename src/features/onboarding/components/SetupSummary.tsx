import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { chainById, chainLogo } from "../../../config/chains";
import { formatBuilderFeePercent } from "../builder-fee";
import { formatCreatorSharePercent } from "../creator-revenue";
import { APP_URL_STEP, NETWORKS_STEP, PARTNER_STEP, REVENUE_STEP } from "../onboarding-steps";
import type { OnboardingDraft } from "../state/types";
import { RevenueWalletLink } from "./RevenueWalletLink";

export type SetupSummaryData = Pick<OnboardingDraft, "displayName" | "partnerName" | "launchPath" | "chainIds" | "revenueWallet" | "requestedCreatorShareBps" | "builderFeeTenthsBps"> & { contact?: string; appUrl?: string; integrationMode?: OnboardingDraft["integrationMode"] };

const rowClass = "flex items-start justify-between gap-3 border-t border-(--edge) py-3.5";
const labelClass = "mb-1.5 block text-[11px] leading-normal text-(--muted)";
const editClass = "-my-1 -mr-2 h-8 min-h-0 min-w-11 gap-1.5 rounded-lg border-0 bg-transparent px-2 py-1 text-xs text-(--link) hover:enabled:bg-(--control-hover) hover:enabled:text-(--link-hover) disabled:text-(--disabled-text) max-[720px]:min-h-0 max-[720px]:px-2 max-[720px]:py-1 max-[720px]:text-xs";
const networkClass = "inline-flex h-8 min-h-0 max-w-full items-center gap-1.5 rounded-full border-0 bg-(--surface) py-1 pr-2.5 pl-1.5 text-xs leading-[1.4] font-normal text-(--secondary-text) max-[720px]:min-h-0 max-[720px]:py-1 max-[720px]:pr-2.5 max-[720px]:pl-1.5 max-[720px]:text-xs";

/** The same snapshot preview before confirmation and after saving. */
export function SetupSummary({ draft, onEdit, disabled = false, className }: {
  draft: SetupSummaryData;
  onEdit?: (step: number, field?: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const api = draft.launchPath === "api";
  const builderFee = formatBuilderFeePercent(draft.builderFeeTenthsBps);
  const feeValue = draft.builderFeeTenthsBps !== undefined
    ? builderFee ? `${builderFee}%` : "Not set"
    : draft.requestedCreatorShareBps == null ? "Not set" : `${formatCreatorSharePercent(draft.requestedCreatorShareBps)}%`;
  return (
    <section className={cn("rounded-[20px] border border-(--edge) bg-(--control-bg) px-5 max-[720px]:px-4", className)} aria-label={onEdit ? "Setup review" : "Saved setup details"}>
      <div className="flex items-center justify-between gap-3 py-4">
        <div className="min-w-0 flex-1">
          <span className={labelClass}>{api ? "Partner ID" : "DEX name"}</span>
          <strong className="block min-w-0 text-xl leading-snug font-semibold tracking-[-0.5px] wrap-anywhere text-(--text) max-[480px]:text-lg">{api ? draft.partnerName : draft.displayName || draft.partnerName}</strong>
        </div>
        {onEdit ? <Button variant="ghost" type="button" className={editClass} disabled={disabled} onClick={() => onEdit(PARTNER_STEP)} aria-label={api ? "Edit partner ID" : "Edit DEX name"}>
          <Pencil size={13} aria-hidden="true" /> Edit
        </Button> : null}
      </div>
      {onEdit && !api && draft.integrationMode === "api" ? <div className={`${rowClass} items-center`}>
        <dl className="m-0 grid min-w-0 flex-1 gap-1"><dt className="text-[11px] text-(--muted)">Partner ID</dt><dd className="m-0 text-sm wrap-anywhere text-(--secondary-text)">{draft.partnerName}</dd></dl>
      </div> : null}
      <div className={`${rowClass} items-center`}>
        <dl className="m-0 grid min-w-0 flex-1 gap-1.5"><dt className="text-[11px] text-(--muted)">Network</dt>
          <dd className="m-0"><ul className="m-0 flex min-w-0 max-w-full list-none flex-wrap gap-1.5 p-0" aria-label="Selected networks">
            {draft.chainIds.map((id) => <li key={id} className="min-w-0 max-w-full"><span className={networkClass}>
              <img className="size-[18px] shrink-0 rounded-full object-contain" src={chainLogo(id)} width={18} height={18} alt="" />
              <span className="min-w-0 whitespace-normal wrap-anywhere">{chainById(id)?.name}</span>
            </span></li>)}
          </ul></dd></dl>
        {onEdit ? <Button variant="ghost" type="button" className={`${editClass} shrink-0`} disabled={disabled} onClick={() => onEdit(NETWORKS_STEP)} aria-label="Edit network"><Pencil size={13} aria-hidden="true" /> Edit</Button> : null}
      </div>
      <div className={`${rowClass} items-center`}>
        <dl className="m-0 grid min-w-0 flex-1 gap-3">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
            <dt className="text-[11px] leading-normal text-(--muted)">{draft.builderFeeTenthsBps === undefined ? "Requested fee share" : "Platform fee"}</dt>
            <dd className="m-0 text-xl leading-tight font-semibold tracking-tight text-(--link) tabular-nums">{feeValue}</dd>
          </div>
          <div className="grid min-w-0 gap-1">
            <dt className="text-[11px] leading-normal text-(--muted)">Revenue wallet</dt>
            <dd className="m-0 font-mono text-xs leading-[1.75] wrap-anywhere text-(--secondary-text)"><RevenueWalletLink address={draft.revenueWallet} chainIds={draft.chainIds} /></dd>
          </div>
        </dl>
        {onEdit ? <Button variant="ghost" type="button" className={`${editClass} shrink-0`} disabled={disabled} onClick={() => onEdit(REVENUE_STEP)} aria-label="Edit earnings">
          <Pencil size={13} aria-hidden="true" /> Edit
        </Button> : null}
      </div>
      {draft.appUrl || (onEdit && draft.integrationMode !== "api") ? <div className={`${rowClass} items-center`}>
        <dl className="m-0 grid min-w-0 flex-1 gap-1"><dt className="text-[11px] text-(--muted)">DEX URL</dt><dd className="m-0 text-sm wrap-anywhere text-(--secondary-text)">{draft.appUrl || "Not provided"}</dd></dl>
        {onEdit && draft.integrationMode !== "api" ? <Button variant="ghost" type="button" className={`${editClass} shrink-0`} disabled={disabled} onClick={() => onEdit(APP_URL_STEP)} aria-label="Edit DEX URL"><Pencil size={13} aria-hidden="true" /> Edit</Button> : null}
      </div> : null}
      {draft.contact || onEdit ? <div className={`${rowClass} items-center`}>
        <dl className="m-0 grid min-w-0 flex-1 gap-1">
          <dt className="text-[11px] leading-normal text-(--muted)">Contact</dt>
          <dd className="m-0 text-sm leading-[1.6] wrap-anywhere text-(--secondary-text)">{draft.contact || "Not provided"}</dd>
        </dl>
        {onEdit ? <Button variant="ghost" type="button" className={`${editClass} shrink-0`} disabled={disabled} onClick={() => onEdit(PARTNER_STEP, "partner-contact")} aria-label="Edit contact">
          <Pencil size={13} aria-hidden="true" /> Edit
        </Button> : null}
      </div> : null}

    </section>
  );
}
