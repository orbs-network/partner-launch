import { PERPS_PLATFORM_FEE_HELP, SPOT_PLATFORM_FEE_HELP } from "../onboarding/platform-fee-help";
import type { ReactNode } from "react";
import { formatSpotFeePercent } from "../onboarding/spot/spot-fee";
import { ArrowLeftRight, CircleAlert, CircleCheck, Copy, LoaderCircle, Rocket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldHelp } from "@/components/FieldHelp";
import { chainById, chainLogo } from "@/config/chains";
import { WalletExplorerLink } from "./WalletExplorerLink";
import { SpotNetworksDialog } from "../onboarding/spot/SpotNetworksDialog";
import type { PendingRequest } from "./request-record";

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
async function copyPartnerId(id: string) {
  try { await navigator.clipboard.writeText(id); toast.success("Partner ID copied"); }
  catch { toast.error("Copy failed. Select the Partner ID to copy it."); }
}

/** Read-only workspace details; status, guidance and actions live around it in SetupDetail. */
export function RequestCard({ request, registryStatus, action, urlAction, children, hidePendingStatus }: { request: PendingRequest; registryStatus: "checking" | "pending" | "changes-pending" | "approved" | "ready" | "error"; action?: ReactNode; urlAction?: ReactNode; children?: ReactNode; hidePendingStatus?: boolean }) {
  const status = registryStatus;
  const StatusIcon = status === "ready" || status === "approved" ? CircleCheck : status === "error" ? CircleAlert : LoaderCircle;
  const statusLabel = status === "changes-pending" ? "Changes pending" : status === "approved" || status === "ready" ? "Active" : status === "error" ? "Status unavailable" : status === "checking" ? "Checking status" : "Approval pending";
  const Icon = request.kind === "spot" ? ArrowLeftRight : Rocket;
  const label = "Revenue wallet";
  const rows: { label: string; value: ReactNode; help?: string }[] = [
    { label: "Website URL", value: (request.kind === "spot" ? request.dexUrl : request.appUrl) || "Not added yet" },
    ...(request.kind === "perps" ? [{ label: "Network", value: <span className="flex flex-wrap items-center gap-x-3 gap-y-2">{request.chainIds.map(id => { const chain = chainById(id); return <span key={id} className="inline-flex items-center gap-2">{chain ? <img src={chainLogo(id)} width={22} height={22} alt="" className="size-[22px] shrink-0 rounded-full object-contain" /> : null}<span>{chain?.name ?? `Chain ${id}`}</span></span>; })}</span> }] : [{ label: "Networks", value: <>All supported networks<SpotNetworksDialog /></> }]),
    { label: "Platform fee", help: request.kind === "perps" ? PERPS_PLATFORM_FEE_HELP : SPOT_PLATFORM_FEE_HELP, value: request.kind === "spot" ? request.tradingFeeTenthsBps === undefined ? "Not specified" : `${formatSpotFeePercent(request.tradingFeeTenthsBps)}%` : request.extraFeePercent === undefined ? "Not specified" : `${request.extraFeePercent}%` },
  ];
  return (
    <article aria-label={`${request.appName} ${request.kind === "spot" ? "Spot" : "Perps"} request`} className="overflow-hidden rounded-[22px] border border-(--edge) bg-(--control-bg)">
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-b border-(--edge) bg-(--surface) px-6 py-4 max-[480px]:px-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-(--primary-soft) text-(--link)"><Icon size={22} aria-hidden="true" /></span>
          <div className="min-w-0"><p className="text-[11px] font-medium uppercase tracking-[0.09em] text-(--muted)">{request.kind === "spot" ? "Spot" : "Perps"}</p><div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1"><h3 className="min-w-0 text-[21px] leading-snug font-semibold tracking-[-0.4px] [overflow-wrap:anywhere]">{request.appName}</h3>
            {!(hidePendingStatus && status === "pending") ? <span role="status" aria-label={status === "approved" ? "Workspace active; trading activation is not confirmed" : undefined} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-(--primary-soft) px-3 py-1 text-xs font-medium text-(--link)"><StatusIcon size={14} className={`shrink-0${status === "checking" || status === "pending" || status === "changes-pending" ? " animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />{statusLabel}</span> : null}</div>
            {request.partnerId ? <div className="flex min-w-0 items-center gap-1 text-sm text-(--secondary-text)"><span className="shrink-0 text-xs text-(--muted)">Partner ID:</span><span className="select-text [overflow-wrap:anywhere]" translate="no">{request.partnerId}</span><Button type="button" variant="ghost" size="icon" className="-my-2 size-11 shrink-0 justify-start bg-transparent pl-1 text-(--link) hover:bg-transparent hover:text-(--link-hover)" aria-label="Copy Partner ID" onClick={() => { void copyPartnerId(request.partnerId!); }}><Copy size={16} aria-hidden="true" /></Button></div> : null}
            <time dateTime={request.savedAt} className="block text-xs tabular-nums text-(--muted)">{dateFormat.format(new Date(request.savedAt))}</time></div>
        </div>
        <div className="flex flex-wrap items-center gap-2 max-[480px]:w-full max-[480px]:justify-between">
          {action}
        </div>
      </div>
      <div className="px-6 pt-5 pb-0 max-[480px]:px-4">
        <h4 className="mb-4 text-sm font-semibold text-(--text)">Workspace details</h4>
        <dl className="m-0 grid grid-cols-2 gap-x-5 gap-y-5 max-[360px]:grid-cols-1 sm:gap-x-8 lg:grid-cols-3">
          {rows.map(row => <div key={row.label} className="min-w-0"><dt className="flex items-center gap-1 text-xs text-(--muted)">{row.label}{row.help ? <FieldHelp label={row.label}>{row.help}</FieldHelp> : null}</dt><dd className="m-0 mt-1.5 select-text text-sm font-medium leading-relaxed [overflow-wrap:anywhere]" translate="no">{row.value}</dd>{row.label === "Website URL" && urlAction ? <dd className="m-0">{urlAction}</dd> : null}</div>)}
        </dl>
        <dl className="m-0 mt-5 grid grid-cols-1 gap-x-8 gap-y-3 border-t border-(--edge) pt-4 sm:grid-cols-2">
          {request.ownerWallets?.length ? <div className="min-w-0"><dt className="text-xs text-(--muted)">DEX owner wallets</dt>{request.ownerWallets.map(address => <dd key={address} className="m-0 min-w-0"><WalletExplorerLink label="DEX owner wallet" address={address} chainIds={request.kind === "perps" ? request.chainIds : undefined} /></dd>)}</div> : null}
          <div className="min-w-0"><dt className="text-xs text-(--muted)">{label}</dt><dd className="m-0 min-w-0"><WalletExplorerLink label={label} address={request.kind === "spot" ? request.feesWallet : request.revenueWallet} chainIds={request.kind === "perps" ? request.chainIds : undefined} /></dd></div>
        </dl>
        {children ? <div className="flex flex-wrap items-center gap-2 border-t border-(--edge) py-4" role="group" aria-label="Integration actions">{children}</div> : null}
      </div>
    </article>
  );
}
