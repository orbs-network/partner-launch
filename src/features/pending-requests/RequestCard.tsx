import type { ReactNode } from "react";
import { formatSpotFeePercent } from "../onboarding/spot/spot-fee";
import { ArrowLeftRight, CircleAlert, CircleCheck, LoaderCircle, Rocket } from "lucide-react";
import { chainById, chainLogo } from "@/config/chains";
import { WalletExplorerLink } from "./WalletExplorerLink";
import type { PendingRequest } from "./request-record";

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

/** Read-only workspace details; status, guidance and actions live around it in SetupDetail. */
export function RequestCard({ request, registryStatus, action, hidePendingStatus }: { request: PendingRequest; registryStatus: "checking" | "pending" | "changes-pending" | "approved" | "ready" | "error"; action?: ReactNode; hidePendingStatus?: boolean }) {
  const status = registryStatus;
  const StatusIcon = status === "ready" || status === "approved" ? CircleCheck : status === "error" ? CircleAlert : LoaderCircle;
  const statusLabel = status === "changes-pending" ? "Changes pending" : status === "approved" ? "Approved" : status === "ready" ? "Trading enabled" : status === "error" ? "Status unavailable" : status === "checking" ? "Checking status" : "Approval pending";
  const Icon = request.kind === "spot" ? ArrowLeftRight : Rocket;
  const label = "Revenue wallet";
  const rows: { label: string; value: ReactNode }[] = [
    { label: "Partner ID", value: request.partnerId ?? "Not available" },
    { label: "Integration", value: request.integrationMode === "ui" ? "Complete trading app" : request.integrationMode === "api" ? "API integration" : request.integrationMode === "existing" ? "Existing app" : "Not specified" },
    { label: "App URL", value: (request.kind === "spot" ? request.dexUrl : request.appUrl) || "Not added yet" },
    ...(request.kind === "perps" ? [{ label: "Network", value: <span className="flex flex-wrap items-center gap-x-3 gap-y-2">{request.chainIds.map(id => { const chain = chainById(id); return <span key={id} className="inline-flex items-center gap-2">{chain ? <img src={chainLogo(id)} width={22} height={22} alt="" className="size-[22px] shrink-0 rounded-full object-contain" /> : null}<span>{chain?.name ?? `Chain ${id}`}</span></span>; })}</span> }] : []),
    { label: "Platform fee", value: request.kind === "spot" ? request.tradingFeeTenthsBps === undefined ? "Not specified" : `${formatSpotFeePercent(request.tradingFeeTenthsBps)}%` : request.extraFeePercent === undefined ? "Not specified" : `${request.extraFeePercent}%` },
  ];
  return (
    <article aria-label={`${request.appName} ${request.kind === "spot" ? "Spot" : "Perps"} request`} className="overflow-hidden rounded-[22px] border border-(--edge) bg-(--control-bg)">
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-4 border-b border-(--edge) bg-(--surface) px-6 py-5 max-[480px]:px-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-(--primary-soft) text-(--link)"><Icon size={22} aria-hidden="true" /></span>
          <div className="min-w-0"><p className="text-[11px] font-medium uppercase tracking-[0.09em] text-(--muted)">{request.kind === "spot" ? "Spot" : "Perps"}</p><h3 className="mt-0.5 text-[19px] leading-snug font-semibold tracking-[-0.4px] [overflow-wrap:anywhere]">{request.appName}</h3><time dateTime={request.savedAt} className="mt-1 block text-xs tabular-nums text-(--muted)">{dateFormat.format(new Date(request.savedAt))}</time></div>
        </div>
        <div className="flex flex-wrap items-center gap-2 max-[480px]:w-full max-[480px]:justify-between">
          {!(hidePendingStatus && status === "pending") ? <span role="status" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-(--primary-soft) px-3 py-2 text-xs font-medium text-(--link)"><StatusIcon size={14} className={`shrink-0${status === "checking" || status === "pending" || status === "changes-pending" ? " animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />{statusLabel}</span> : null}
          {action}
        </div>
      </div>
      <div className="px-6 py-5 max-[480px]:px-4">
        <h4 className="mb-4 text-sm font-semibold text-(--text)">Workspace details</h4>
        <dl className="grid grid-cols-2 gap-x-5 gap-y-5 max-[360px]:grid-cols-1 sm:gap-x-8 lg:grid-cols-3">
          {rows.map(row => <div key={row.label} className="min-w-0"><dt className="text-xs text-(--muted)">{row.label}</dt><dd className="m-0 mt-1.5 select-text text-sm font-medium leading-relaxed [overflow-wrap:anywhere]" translate="no">{row.value}</dd></div>)}
        </dl>
        <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-3 border-t border-(--edge) pt-4 sm:grid-cols-2">
          {request.ownerWallets?.length ? <div className="min-w-0"><dt className="text-xs text-(--muted)">App owner wallets</dt>{request.ownerWallets.map(address => <dd key={address} className="m-0 min-w-0"><WalletExplorerLink label="App owner wallet" address={address} chainIds={request.kind === "perps" ? request.chainIds : undefined} /></dd>)}</div> : null}
          <div className="min-w-0"><dt className="text-xs text-(--muted)">{label}</dt><dd className="m-0 min-w-0"><WalletExplorerLink label={label} address={request.kind === "spot" ? request.feesWallet : request.revenueWallet} chainIds={request.kind === "perps" ? request.chainIds : undefined} /></dd></div>
        </dl>
      </div>
    </article>
  );
}
